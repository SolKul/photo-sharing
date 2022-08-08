import firebaseApp from "../components/fire"
import { 
  getFirestore,
  collection, 
  query, 
  orderBy,
  QuerySnapshot,
  getDocs, 
  DocumentData,
  QueryDocumentSnapshot} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import {getAuth, onAuthStateChanged} from 'firebase/auth'
import { useState } from "react";

const db = getFirestore(firebaseApp)
const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp)

export type ImageInfo = {
  id: string
  thumbUrl: string
  previewUrl:string
  valid:boolean
}

export const userImages=()=>{
  const [imgList, setImglist] = useState<ImageInfo[]>([])
  const [isLoading,setIsLoading]=useState<boolean>(true)
  const [isError,setIsError]=useState<boolean>(false)

  const startFetchImages=()=>{
    const unsub =onAuthStateChanged(auth,(user)=>{
      if (user==null){
        console.error("not logined")
        unsub()
        setIsError(true)
      }else{
        fetchImages().then(
          (resImgList)=>{
            setImglist(resImgList)
            setIsLoading(false)
          }
        )
      }
    })
  }

  /**
   * FireStore(データベース)を読み込み、
   * それをもとにStorageから画像ダウンロードURLが入った
   * 画像情報を格納した配列を返却するPromiseを返す関数
   */
  const fetchImages=()=>{
    return genSnapshot().then(
      (snapshot)=>{
        return getDownUrls(snapshot)
      }
    )
  }

  /**
   * FireStore(データベース)から、
   * 写真データを読み込み、snapshopをresolveするPromiseを返す関数
   */
  const genSnapshot=()=>{
    // collection()が失敗するかもしれないのでtry~catchで囲む
    try{
      // collectionへの参照を取得
      const photoRef = collection(db, "photos");
      // 写真をアップロード日降順で取得(最新のが1番上に)
      const photoQuery = query(photoRef, orderBy("timeCreated","desc"));
      // データベースを読み込む
      return getDocs(photoQuery)
    }catch(error){
      return Promise.reject(error)
    }
  }

  /**
   * FireStore(データベース)を読み込んだ結果であるsanpshotを受け取り、
   * それをもとに画像情報の取得を開始する。
   * 情報の取得が完了すると、画像情報を格納した配列を返却するPromiseを返す関数
   */
  const getDownUrls=(snapshot:QuerySnapshot)=>{
    // imlistにsetする前の画像情報を格納するための仮の配列
    const tmpImList: ImageInfo[] = [];
    // Promiseの配列
    const tasks: Array<Promise<string|void>> = [];

    // 配列の要素全てを取り出し、順番通りにtmpImListにダウンロードURLを格納
    let index=0
    snapshot.forEach((document)=>{
      pushDownUrlTask(document,tmpImList,tasks,index) && (index +=1)
    })

    return Promise.all(tasks).then(()=>tmpImList)
  }

  const pushDownUrlTask=(
    document:QueryDocumentSnapshot<DocumentData>,
    tmpImList:ImageInfo[],
    tasks:Promise<string|void>[],
    index:number
  )=>{
    const doc=document.data()
    if (!doc.thumbFilePath || !doc.filePath || !doc.visibility) return false
    tmpImList[index]={
      id:document.id,
      thumbUrl:"",
      previewUrl:"",
      valid:true
    }

    // サムネイル画像URL取得処理
    // console.log(doc.thumbFilePath)
    tasks.push(getDownloadURL(ref(storage,doc.thumbFilePath))
      .then((thumbUrl:string)=>{
        tmpImList[index]={
          ...tmpImList[index],
          thumbUrl:thumbUrl
        }
      },()=>{        
        tmpImList[index]={
          ...tmpImList[index],
          valid:false
        } 
      })
    )

    // プレビュー画像URL取得処理
    tasks.push(getDownloadURL(ref(storage,doc.filePath))
      .then((previewUrl:string)=>{
        tmpImList[index]={
          ...tmpImList[index],
          previewUrl:previewUrl
        }
      },()=>{        
        tmpImList[index]={
          ...tmpImList[index],
          valid:false
        } 
      })
    )

    return true
  }

  return {imgList,isLoading,isError,startFetchImages}
}