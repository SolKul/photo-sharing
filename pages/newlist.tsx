import firebaseApp from "../components/fire"
import { getFirestore,collection, getDocs } from "firebase/firestore";
import { useState,useEffect } from "react";

import Layout from '../components/Layout'
import { ImageList,ImageInfo } from "../components/ImageList";

const db = getFirestore(firebaseApp);

export default function Home(){
  const [imlist, setImlist] = useState<ImageInfo[]>([])

  useEffect(()=>{
    // 画像情報を格納するための仮の配列
    const temp_imlist: ImageInfo[] = [];
    // collectionへの参照を取得
    const colRef = collection(db, "photos");
    // collection内のdocumentの配列を取得
    getDocs(colRef).then((snapshot)=>{
      // 配列の要素全てを取り出し、temp_imlistに格納
      snapshot.forEach((document)=>{
        const doc=document.data()
        temp_imlist.push(
          {
            id:document.id,
            url:document.data().downloadUrl
          }
        )
      })
      // 逆順にしてステートに保存
      setImlist(temp_imlist.reverse())
    })
  },[])

  return (
    <div>
      <Layout header='Photo Sharing' title='New Photo List page'>
        こんにち！
        <ImageList imlist={imlist}/>
      </Layout>
    </div>
  )
}

