import firebaseApp from "../components/fire"
import { getFirestore,collection, getDocs,query, orderBy, QuerySnapshot, where } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import {getAuth} from 'firebase/auth'
import { useState,useEffect } from "react";

import Layout from '../components/Layout'
import UploadModal from "../components/UploadModal";
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
      previewUrl:""
    }

    // サムネイル画像URL取得処理
    tasks.push(getDownloadURL(ref(storage,fileInfo.thumbFilePath))
      .then((thumbUrl:string)=>{
        tmpImList[index]={
          ...tmpImList[index],
          thumbUrl:thumbUrl
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
      })
    )
  })

  return {tmpImList,tasks}
}

export default function Home(){
  const [imList, setImlist] = useState<ImageInfo[]>([])
  const [show, setShow] = useState<boolean>(false)
  const [relist, setRelist] = useState<boolean>(true)
  const router=useRouter()

  const storeUrl=()=>{
    console.log("start store url")
    // collection()が失敗するかもしれないのでtry~catchで囲む
    try{
      // collectionへの参照を取得
      const photoRef = collection(db, "photos");
      // 写真をアップロード日降順で取得(最新のが1番上に)
      const photoQuery = query(photoRef, orderBy("timeCreated","desc"));
      getDocs(photoQuery)
      .then(
        (snapshot)=>{
          const {tmpImList,tasks}=genFetchUrlTasks(snapshot)

          // 全てのPromieseが終わったのを待ち、imListにsetする
          Promise.all(tasks).then(() => {
            setImlist(tmpImList)
          })
        },
        (error)=>{
          console.log(error)
        }
      )
    }catch(error){
      console.log(error)
    }

  }

  const findFile=(fileName:string)=>{
    try{
      // collectionへの参照を取得
      const photoRef = collection(db, "photos");
      // 写真をアップロード日降順で取得(最新のが1番上に)
      const filePath=`photos/${fileName}`
      const photoQuery = query(photoRef, where("filePath", "==", filePath));
      return getDocs(photoQuery)
        .then(
          (snapshot)=>{
            if (snapshot.empty){
              console.log("photo didn't find")
              return false
            }else{
              console.log("photo found")
              return true
            }
          },
          (error)=>{
            console.log("photo didn't find")
            console.log(error)
            return false
          }
        )
    }catch(error){
      console.log(error)
      return false
    }
  }

  useEffect(()=>{
    if (auth.currentUser == null){
      router.push('/login')
    }else if(relist){
      setRelist(false)
      storeUrl()
    }
  },[relist])

  return (
    <div>
      <Layout header='Photo Sharing' title='New Photo List page' href="/">
        <div className="container mt-2">
        <ImageList imlist={imList}/>
        </div>
        <div className={`btn ${styles.fixed_btn}`} onClick={()=>(setShow(true))}>
          <img className={styles.plus_circular_btn} src="./plus-circular-button.svg"></img>
        </div>
        <UploadModal show={show} setShow={setShow} setRelist={setRelist} findFile={findFile}/>
      </Layout>
    </div>
  )
}