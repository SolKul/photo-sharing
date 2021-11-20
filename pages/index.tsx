import styles from '../styles/Home.module.scss'
import Link from 'next/link'
import { signInAnonymously,getAuth } from "firebase/auth";
import firebaseApp from "../components/fire"

import Layout from '../components/Layout'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/dist/client/router';

const auth = getAuth(firebaseApp);

export default function Home(){
  const router = useRouter()
  const [message,setMessage] = useState<string>("wait ...")

  useEffect(()=>{
    if (auth.currentUser == null){
      signInAnonymously(auth)
        .then((result)=>{
          setMessage('logined ' + result.user.displayName)
        },(error)=>{
          router.push('/')
        })
    }else{
      setMessage('logined ' + auth.currentUser.displayName)
    }
  },[])

  return (
    <div>
      <Layout header='Photo Sharing' title='Top page.'>
      <div className="container mt-2">
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
        <div>
          <Link href="/login">
            <a>Login Page</a>
          </Link>
        </div>
        <div>
          <Link href="/token">
            <a>Token Page</a>
          </Link>
        </div>
      </div>
      </Layout>
    </div>
  )
}