import firebaseApp from "../components/fire"
import { getFirestore,collection, getDocs } from "firebase/firestore";
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

export default function Home(){
  const [message,setMessage]=useState<string>("")
  const [imList, setImlist] = useState<ImageInfo[]>([])
  const router=useRouter()

  const storeUrl=()=>{

    // 順番通りに画像情報を格納するための配列
    const fileInfoList:FileInfo[]=[]
    // imlistにsetする前の画像情報を格納するための仮の配列
    const tmpImList: ImageInfo[] = [];
    // collectionへの参照を取得
    const colRef = collection(db, "photos");
    // Promiseの配列
    const tasks: Array<any> = [];
    // collection内のdocumentの配列を取得
    getDocs(colRef).then((snapshot)=>{
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

      // 全てのPromieseが終わったのを待ち、imListにsetする
      Promise.all(tasks).then(() => {
        setImlist(tmpImList)
      })
    })

  }

  useEffect(()=>{
    if (auth.currentUser == null){
      router.push('/')
    }else{
      setMessage('logined ' + auth.currentUser.displayName)
      setTimeout(storeUrl,100)
    }
  },[])

  return (
    <div>
      <Layout header='Photo Sharing' title='New Photo List page'>
        <p>{message}</p>
        こんにちは
        <ImageList imlist={imList}/>
      </Layout>
    </div>
  )
}

