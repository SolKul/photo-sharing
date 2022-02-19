import Link from 'next/link'
import firebaseApp from "../components/fire"
import { getFirestore, doc, getDoc, onSnapshot, updateDoc, Unsubscribe, collection,query,where } from "firebase/firestore";

import Layout from '../components/Layout'
import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';

const db = getFirestore(firebaseApp);

export default function Sample(){
  const router = useRouter()
  const [age,setAge]=useState<number>(0)

  const onChangeAge=(e:React.ChangeEvent<HTMLInputElement>)=>{
    setAge(Number(e.target.value))
  } 

  const submitData=(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    updateDoc(doc(db,"mydata","1"),{age:age})
  }

  const readData=(e:any)=>{
    getDoc( doc(db,"mydata","1")).then(
      (snapshot)=>{
        if (snapshot.exists()){
          // const source = snapshot.metadata.hasPendingWrites ? "Local" : "Server";
          console.log(snapshot.data())
        }
      }
    )
  }

  useEffect(()=>{
    const mydataRef =collection(db,"mydata")
    const q = query(mydataRef,where("name","==","taro"))
    const unsubscribe:Unsubscribe =onSnapshot( 
      q,
      (querySnapshot)=>{
        const taros:any=[]
        console.log("querySnapshotは空か？",querySnapshot.empty)
        querySnapshot.forEach((doc)=>{
          taros.push(doc.data())
        })
        const source = querySnapshot.metadata.hasPendingWrites ? "Local" : "Server";
        console.log("データに変更がありました:")
        console.log(source,taros)
    })
    return ()=>{
      console.log("unmount !")
      unsubscribe()
    }
  },[])

  const returnTop=()=>{
    router.push("/")
  }

  return <div>
    <Layout header='Photo Sharing' title='Listen Test Page'>
    <div className="container mt-2">
      <form className="form-group" onSubmit={submitData}>
        <label>Age:</label>
        <input type="number" onChange={onChangeAge} className="form-control" />
        <button className="btn btn-primary m-3">データ登録</button>
      </form>
      <button className="btn btn-primary m-3" onClick={readData}>データ確認</button>
      <button className="btn btn-primary m-3" onClick={returnTop}>トップページに戻る</button>
    </div>
    </Layout>
  </div>
}