import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'

import firebaseApp from "../components/fire"
import { getAuth } from "firebase/auth";

import Layout from '../components/Layout'

const auth = getAuth(firebaseApp);

export default function Home(){
  const router = useRouter()

  useEffect(()=>{
    if (auth.currentUser == null){
      console.log("not logined")
      router.push('/login')
    }
  },[])

  const doLogout = ()=>{
    console.log("logout: ",auth.currentUser && auth.currentUser.uid)
    auth.signOut()
  }

  return (
    <div>
      <Layout header='Photo Sharing' title='Top page.'>
      <div className="container mt-2">
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
        <div>
          <Link href="/sample">
            <a>Sample Page</a>
          </Link>
        </div>
        <div>
          <Link href="/login">
            <a onClick={doLogout}>Logout</a>
          </Link>
        </div>
      </div>
      </Layout>
    </div>
  )
}