import { useState,useEffect } from "react";
import { useRouter } from "next/router";

import firebaseApp from "../components/fire"
import { getFirestore,collection, getDocs } from "firebase/firestore";
import { getAuth} from 'firebase/auth'

import Layout from '../components/Layout'
import styles from '../styles/Home.module.scss'

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

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

export default function Home(){
  const [message,setMessage]=useState<string>("wait ...")
  const [imTable, setImTable] = useState<JSX.Element[]>([])
  const [show, setShow] = useState<boolean>(false)
  const router=useRouter()

  const makeImTable=()=>{

    // 順番通りに画像情報を格納するための配列
    const tmpImTable:JSX.Element[]=[]
    try{
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
    }catch(error){
      setMessage("Failed access data")
      console.log(error)
    }

  }

  const focusModal=(e:any)=>{
    e.preventDefault()

  }

  useEffect(()=>{
    if (auth.currentUser == null){
      router.push('/login')
    }else{
      makeImTable()
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
        <button onClick={() => setShow(true)}>Click</button>
        <Modal show={show} setShow={setShow}/>


      </Layout>
    </div>
  )
}


const Modal=({show,setShow}:any)=>{
  const closeModal = () => {
    setShow(false)
  }

  if (show) {
    return <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e:any) => e.stopPropagation()}>
        <p>これがモーダルウィンドウです。</p>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  } else {
    return null;
  }
}