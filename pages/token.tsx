import firebaseApp from "../components/fire"
import { getFirestore,collection, getDocs } from "firebase/firestore";
import { getAuth,Auth} from 'firebase/auth'
import { useState,useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

import Layout from '../components/Layout'
import { useRouter } from "next/dist/client/router";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const functions = getFunctions(firebaseApp,"asia-northeast1");
// connectFunctionsEmulator(functions, "localhost", 5001);

// Dateオブジェクトをスラッシュ区切りの日付表示に
const convertDateSlash=(date:Date)=>{
  const year=date.getFullYear()
  const month=zeroPadding(date.getMonth()+1,2)
  const day=zeroPadding(date.getDate(),2)
  const hour=zeroPadding(date.getHours(),2)
  const minute=zeroPadding(date.getMinutes(),2)
  return `${year}/${month}/${day} ${hour}:${minute}`
}

// ゼロ埋め
const zeroPadding=(num:number,length:number)=> ('0000000000' + num).slice(-length);

const requireVerification=async(user: Auth["currentUser"])=>{
  if(user){
    const verifyCode = httpsCallable(functions, "authWithCode");
    try {
      await verifyCode({verifyCode:"1222"})
      const idTokenResult = await user.getIdTokenResult(true)
      if (idTokenResult.claims.codeVerified){
        return "code verified!"
      }else{
        throw "failed ..."
      }
    }catch(error){
      console.log(error)
      throw "failed ..."
    }
  }
}

export default function Home(){
  const [message,setMessage]=useState<string>("")
  const [imTable, setImTable] = useState<JSX.Element[]>([])
  const router=useRouter()

  const makeImTable=()=>{

    // 順番通りに画像情報を格納するための配列
    const tmpImTable:JSX.Element[]=[]
    // collectionへの参照を取得
    const colRef = collection(db, "photos");
    // collection内のdocumentの配列を取得
    getDocs(colRef)
    .then(
      (snapshot)=>{
        // 配列の要素全てを取り出し、file情報を順番通りにfileInfoListに格納
        snapshot.forEach((document)=>{
          const doc=document.data()
          tmpImTable.push(
            <tr key={document.id}>
              <td>{document.id}</td>
              <td>{doc.filePath}</td>
              <td>{ convertDateSlash(doc.timeCreated.toDate()) }</td>
            </tr>
          )
        })
        setMessage("Success access data")
        setImTable(tmpImTable)
      },
      (error)=>{
        setMessage("Failed access data")
        console.log(error)
    })

  }

  useEffect(()=>{
    if (auth.currentUser == null){
      router.push('/')
    }else{
      requireVerification(auth.currentUser).then(
        (result)=>{
          setTimeout(makeImTable,100)
        },
        (error)=>{
          setMessage("Failed Authenticated")
          console.log(error)
        })
    } 
  },[])

  return (
    <div>
      <Layout header='Photo Sharing' title='Token Test Page'>
        <p>{message}</p>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>File Path</th>
              <th>Time Created</th>
            </tr>
          </thead>
          <tbody>
            {imTable}
          </tbody>
        </table>

      </Layout>
    </div>
  )
}

