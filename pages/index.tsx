import firebaseApp from "../components/fire"
import { getFirestore,collection, getDocs,query, orderBy, QuerySnapshot, where,Unsubscribe,onSnapshot, DocumentChange, DocumentData } from "firebase/firestore";
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
 * idをキーに画像情報を格納したオブジェクトと、それが完了するPromiseの配列tasksを返す
 */
const genFetchChangeTasks=(changes:DocumentChange<DocumentData>[])=>{
  // imlistにsetする前の画像情報を格納するための仮のオブジェクト
  const tmpImList:any= {};
  // Promiseの配列
  const tasks: Array<Promise<string|void>> = [];

  // 配列の要素全てを取り出し、file情報を順番通りにfileInfoListに格納
  changes.forEach((change)=>{
    const docData=change.doc.data()
    if (docData.thumbFilePath && docData.filePath){
      tmpImList[change.doc.id]={
        thumbUrl:"",
        previewUrl:"",
        id:change.doc.id,
        timeCreated:docData.timeCreated,
        valid:true
      }

      // サムネイル画像URL取得処理
      tasks.push(getDownloadURL(ref(storage,docData.thumbFilePath))
        .then((thumbUrl:string)=>{
          tmpImList[change.doc.id]={
            ...tmpImList[change.doc.id],
            thumbUrl:thumbUrl
          }
        },()=>{        
          tmpImList[change.doc.id]={
            ...tmpImList[change.doc.id],
            valid:false
          } 
        })
      )

      // プレビュー画像URL取得処理
      tasks.push(getDownloadURL(ref(storage,docData.filePath))
        .then((previewUrl:string)=>{
          tmpImList[change.doc.id]={
            ...tmpImList[change.doc.id],
            previewUrl:previewUrl
          }
        },()=>{        
          tmpImList[change.doc.id]={
            ...tmpImList[change.doc.id],
            valid:false
          } 
        })
      )
    }//end if
  })//end forEach

  return {tmpImList,tasks}
}

export default function Home(){
  const [imList, setImlist] = useState<any>({})
  const router=useRouter()

  const listenImagesUpdate=()=>{
    // collection()が失敗するかもしれないのでtry~catchで囲む
    try{
      // collectionへの参照を取得
      const photoRef = collection(db, "photos");
      // 写真をアップロード日降順で取得(最新のが1番上に)
      const photoQuery = query(photoRef, orderBy("timeCreated","desc"));
      const unsubscribe = onSnapshot(
        photoQuery,
        (snapshot)=>{
          console.log("写真がアップデートされた")
          const changes = snapshot.docChanges()
          const {tmpImList,tasks}=genFetchChangeTasks(changes)
          // 全てのPromieseが終わったのを待ち、imListにsetする
          Promise.all(tasks).then(() => {
            setImlist((prevList:any)=>{return {...prevList,...tmpImList}})
          })
        })
      return unsubscribe
    }catch(error){
      console.log(error)
    }
  }

  const postUpload=(fileName:string,afterDataAdded:()=>void)=>{
    try{
      // collectionへの参照を取得
      const photoRef = collection(db, "photos");
      const filePath=`photos/${fileName}`
      const photoQuery = query(photoRef, where("filePath", "==", filePath));
      const unsubscribe =onSnapshot(
        photoQuery,
        (querysnapShot)=>{
          if(!querysnapShot.empty){
            console.log("file found")
            afterDataAdded()
            unsubscribe()
          }
        }
      )
    }catch(error){
      afterDataAdded()
    }
  }

  useEffect(()=>{
    if (auth.currentUser == null){
      router.push('/login')
    }else{
      return listenImagesUpdate()
    }
  },[])

  return (
    <div>
      <Layout header='Photo Sharing' title='Photo Sharing' href="/">
        <div className="container mt-2">
        <ImageList imlist={imList}/>
        <UploadLayer fetchImage={fetchImage} postUpload={postUpload}/>
        </div>
      </Layout>
    </div>
  )
}