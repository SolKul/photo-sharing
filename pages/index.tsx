import firebaseApp from "../components/fire"
import { getFirestore,collection, query, orderBy, QuerySnapshot, onSnapshot } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import {getAuth} from 'firebase/auth'
import { useState,useEffect } from "react";

import Layout from '../components/Layout'
import UploadLayer from "../components/UploadLayer";
import { ImageList,ImageInfo } from "../components/ImageList";
import { useRouter } from "next/dist/client/router";
import styles from '../styles/Home.module.scss'

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp);

type FileInfo={
  thumbFilePath:string
  previewFilePath:string
  id:string
}

/**
 * 画像情報を格納した配列と、それが完了するPromiseの配列tasksを返す
 */
const genFetchUrlTasks=(snapshot:QuerySnapshot)=>{
  // 順番通りに画像情報を格納するための配列
  const fileInfoList:FileInfo[]=[]
  // imlistにsetする前の画像情報を格納するための仮の配列
  const tmpImList: ImageInfo[] = [];
  // Promiseの配列
  const tasks: Array<Promise<string|void>> = [];

  let count=0

  // 配列の要素全てを取り出し、file情報を順番通りにfileInfoListに格納
  snapshot.forEach((document)=>{
    const doc=document.data()
    if (doc.thumbFilePath && doc.filePath){
      fileInfoList.push(
        {
          thumbFilePath:doc.thumbFilePath,
          previewFilePath:doc.filePath,
          id:document.id
        }
      )
    }
  });

  // 配列のmapではインデックス番号が取得できるので、
  // 処理の順番が違っても順番通りにtmpImListに格納できる
  // そしてそれらのPromiseをtasksに格納
  fileInfoList.map((fileInfo,index)=>{
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

  return {tmpImList,tasks}
}

export default function Home(){
  const [imList, setImlist] = useState<ImageInfo[]>([])
  const router=useRouter()

  const fetchImage=()=>{
    console.log("start fetch images")
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
          console.log("写真がアップデートされた")
          const {tmpImList,tasks}=genFetchUrlTasks(snapshot)
          // 全てのPromieseが終わったのを待ち、imListにsetする
          Promise.all(tasks).then(() => {
            setImlist(tmpImList)
          })// end Promise
        } // end Callback
      ) // end onSnapshot
      // useEffectのreturnに関数を渡すことで、
      // unmount時に関数を実行するので、
      // unmount時にlistenを止めるためにunsubscribeを返す
      return unsubscribe
    }catch(error){
      console.log(error)
    }
  }

  useEffect(()=>{
    if (auth.currentUser == null){
      router.push('/login')
    }else{
      return fetchImage()
    }
  },[])

  return (
    <div>
      <Layout header='Photo Sharing' title='Photo Sharing' href="/">
        <div className="container mt-2">
        <ImageList imlist={imList}/>
        <UploadLayer/>
        </div>
      </Layout>
    </div>
  )
}