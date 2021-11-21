import firebaseApp from "../components/fire"
import { getFirestore,collection, getDocs,QuerySnapshot } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import {getAuth} from 'firebase/auth'
import { useState,useEffect } from "react";

import Layout from '../components/Layout'
import { ImageList,ImageInfo } from "../components/ImageList";
import { useRouter } from "next/dist/client/router";

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp);

type FileInfo={
  filePath:string
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
    fileInfoList.push(
      {
        filePath:doc.filePath,
        id:document.id
      }
    )
  })

  // 配列のmapではインデックス番号が取得できるので、
  // 処理の順番が違っても順番通りにtmpImListに格納できる
  // そしてそれらのPromiseをtasksに格納
  fileInfoList.map((fileInfo,index)=>{
    tasks.push(getDownloadURL(ref(storage,fileInfo.filePath))
      .then((storageUrl:string)=>{
        tmpImList[index]={
          id:fileInfo.id,
          url:storageUrl
        }
      })
    )
  })

  return {tmpImList,tasks}
}

export default function Home(){
  const [message,setMessage]=useState<string>("wait ...")
  const [imList, setImlist] = useState<ImageInfo[]>([])
  const router=useRouter()

  const storeUrl=()=>{
    // collection()が失敗するかもしれないのでtry~catchで囲む
    try{
      // collectionへの参照を取得
      const colRef = collection(db, "photos");
      // collection内のdocumentの配列を取得
      getDocs(colRef)
      .then(
        (snapshot)=>{
          setMessage("Success access data")
          const {tmpImList,tasks}=genFetchUrlTasks(snapshot)

          // 全てのPromieseが終わったのを待ち、imListにsetする
          Promise.all(tasks).then(() => {
            setImlist(tmpImList)
          })
        },
        (error)=>{
          setMessage("Failed access data")
          console.log(error)
        }
      )
    }catch(error){
      setMessage("Failed access data")
      console.log(error)
    }

  }

  useEffect(()=>{
    if (auth.currentUser == null){
      router.push('/login')
    }else{
      storeUrl()
    }
  },[])

  return (
    <div>
      <Layout header='Photo Sharing' title='New Photo List page'>
        <div className="container mt-2">
        <p>{message}</p>
        <ImageList imlist={imList}/>
        </div>
      </Layout>
    </div>
  )
}

