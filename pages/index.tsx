import firebaseApp from "../components/fire"
import { getFirestore,collection, query, orderBy, QuerySnapshot, onSnapshot } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import {getAuth, onAuthStateChanged} from 'firebase/auth'
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

export default function Home(){
  const [imList, setImlist] = useState<ImageInfo[]>([])
  const [authLoading,setAuthLoading]=useState<boolean>(true)
  const router=useRouter()

  const fetchImage=()=>{
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

  useEffect(()=>{
    return onAuthStateChanged(auth,(user)=>{    
      if (user == null){
        router.push('/login')
      }else{
        return fetchImage()
      }// end else
    })//end onAuthState
  },[])

  return (
    <div>
      <Layout header='T&amp;M Wedding' title='T&amp;M Wedding' href="/">
        <div className="container mt-2">
          {
            authLoading
              ?
            <div>
            <div style={{height: "10rem"}} />
            <div className={`d-flex justify-content-center`}>
              <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
              </div>
            </div>
            </div>
              :
            <div>
            <ImageList imlist={imList}/>
            <UploadLayer/>
            </div>
          }
        </div>
      <GuestBtn/>
      </Layout>
    </div>
  )
}

const GuestBtn=()=>{
  const router = useRouter()

  return <div className="btn" onClick={()=>{router.push("/groups")}}>
    <style jsx>{`
      .btn{
        z-index:1;
        position: fixed;
        bottom: 5rem; 
        right: 1rem;
      }
      
      .circleBtn{
        width: 3rem;
        height: 3rem;
      }
    `}</style>
    <img className="circleBtn" src="./guests.svg"></img>
  </div>
}