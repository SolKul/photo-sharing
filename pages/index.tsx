import styles from '../styles/Home.module.scss'
import Link from 'next/link'
import { GoogleAuthProvider,getAuth,signInWithPopup } from "firebase/auth";
import firebaseApp from "../components/fire"

import Layout from '../components/Layout'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/dist/client/router';

const provider = new GoogleAuthProvider();
const auth = getAuth(firebaseApp);

export default function Home(){
  const router = useRouter()
  const [message,setMessage] = useState<string>("wait ...")

  useEffect(()=>{
    if (auth.currentUser == null){
      signInWithPopup(auth, provider)
        .then((result)=>{
          setMessage('logined ' + result.user.displayName)
        },(error)=>{
          router.push('/')
        })
    }else{
      setMessage('logined ' + auth.currentUser.displayName)
    }
  },[])

  const item_list=[]
  for (let i=0;i<5;i++){
    item_list.push(
    <div className="col-4 col-lg-3">
      <div>col-4</div>
    </div>)
  }

  return (
    <div>
      <Layout header='Photo Sharing' title='Top page.'>
        <p>{message}</p>
        <div>
        <Link href="/upload">
          <a>Upload Page</a>
        </Link>
        </div>
        <div>
        <Link href="/newlist">
          <a>List Page</a>
        </Link>
        </div>
        <div className={`row g-0 ${styles.square}`}>
          {item_list}
        </div>
      </Layout>
    </div>
  )
}