import firebaseApp from "../components/fire"
import {getAuth, onAuthStateChanged} from 'firebase/auth'
import { useState,useEffect } from "react";

import Layout from '../components/Layout'
import UploadLayer from "../components/UploadLayer";
import { ImageList,ImageInfo } from "../components/ImageList";
import {fetchImage} from "../components/GetImages"
import { useRouter } from "next/router";

const auth = getAuth(firebaseApp);

export default function Home(){
  const [imList, setImlist] = useState<ImageInfo[]>([])
  const [authLoading,setAuthLoading]=useState<boolean>(true)
  const router=useRouter()

  useEffect(()=>{
    return onAuthStateChanged(auth,(user)=>{    
      if (user == null){
        router.push('/login')
      }else{
        return fetchImage(setImlist,setAuthLoading,router)
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