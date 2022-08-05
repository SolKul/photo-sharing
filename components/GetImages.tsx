import firebaseApp from "../components/fire"
import { getFirestore,collection, query, orderBy, QuerySnapshot, onSnapshot } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from 'firebase/storage'

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp)

import { ImageInfo } from "./ImageList";
import { NextRouter } from "next/router";

type FileInfo={
  thumbFilePath:string
  previewFilePath:string
  id:string
}

/**
 * FireStore(データベース)を読み込んだ結果であるsanpshotを受け取り、
 * それをもとに画像情報の取得を開始する。
 * 情報の取得が完了すると、画像情報を格納した配列を返却するPromiseを返す関数
 */
 const genFetchUrlTasks=(snapshot:QuerySnapshot)=>{
  // 順番通りに画像情報を格納するための配列
  const fileInfoList:FileInfo[]=[]
  // imlistにsetする前の画像情報を格納するための仮の配列
  const tmpImList: ImageInfo[] = [];
  // Promiseの配列
  const tasks: Array<Promise<string|void>> = [];

  // 配列の要素全てを取り出し、file情報を順番通りにfileInfoListに格納
  snapshot.forEach((document)=>{
    const doc=document.data()
    if (doc.thumbFilePath && doc.filePath && doc.visibility){
      fileInfoList.push(
        {
          thumbFilePath:doc.thumbFilePath,
          previewFilePath:doc.filePath,
          id:document.id
        }
      )
    }
  });

  // 配列のforEachではインデックス番号が取得できるので、
  // 処理の順番が違っても順番通りにtmpImListに格納できる
  // そしてそれらのPromiseをtasksに格納
  fileInfoList.forEach((fileInfo,index)=>{
    tmpImList[index]={
      id:fileInfo.id,
      thumbUrl:"",
      previewUrl:"",
      valid:true
    }

    // サムネイル画像URL取得処理
    tasks.push(getDownloadURL(ref(storage,fileInfo.thumbFilePath))
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
    tasks.push(getDownloadURL(ref(storage,fileInfo.previewFilePath))
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
  })

  return Promise.all(tasks).then(()=>tmpImList)
}

/**
 * FireStore(データベース)から、
 * onSnapshotで写真データを読み込むことで、データベースが更新されるたびに
 * 写真データリストimListの全てを更新する
 * snapshot.docChanges((change)=>{})のようにすることで
 * 追加分だけの写真データを取得することもできるが、
 * 写真が削除(visiblity:falseと更新)された際の処理が面倒なので全リストを更新している。
 */
export const fetchImage=(
    setImlist:React.Dispatch<React.SetStateAction<any>>,
    setAuthLoading:React.Dispatch<React.SetStateAction<any>>,
    router:NextRouter)=>{
  // collection()が失敗するかもしれないのでtry~catchで囲む
  try{
    // collectionへの参照を取得
    const photoRef = collection(db, "photos");
    // 写真をアップロード日降順で取得(最新のが1番上に)
    const photoQuery = query(photoRef, orderBy("timeCreated","desc"));
    // 更新をサブスクライブする
    const unsubscribe = onSnapshot(
      photoQuery,
      (snapshot)=>{
        genFetchUrlTasks(snapshot)
        .then((tmpImList) => {
          setImlist(tmpImList)
          setAuthLoading(false)
        })// end Promise
      },
      (error)=>{
        console.log(error)
        router.push('/login')
      } // end Callback
    ) // end onSnapshot
    // useEffectのreturnに関数を渡すことで、
    // unmount時に関数を実行するので、
    // unmount時にlistenを止めるためにunsubscribeを返す
    return unsubscribe
  }catch(error){
    console.log(error)
    router.push('/login')
  }
}