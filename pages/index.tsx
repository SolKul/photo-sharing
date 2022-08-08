import { useState,useEffect } from "react";

import Layout from '../components/Layout'
import UploadLayer from "../components/UploadLayer";
import { ImageList} from "../components/ImageList";
import { useImages} from "../components/GetImages"
import { useRouter } from "next/router";

export default function Home(){
  const router=useRouter()
  const {imgList,isLoading,isError,existAdjacentPage,authAndFetchImages,fetchImages}=useImages(10)

  useEffect(()=>{
    authAndFetchImages()
  },[])

  useEffect(()=>{
    isError && router.push("/login")
  },[isError])

  return (
    <div>
      <Layout header='T&amp;M Wedding' title='T&amp;M Wedding' href="/">
        <div className="container mt-2">
          {
            isLoading
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
            <ImageList imgList={imgList}/>
            <UploadLayer/>
            {
              existAdjacentPage.prev
                &&
              <div onClick={fetchImages.bind(null,"prev")}>prev</div>
            }
            {
              existAdjacentPage.next
                &&
              <div onClick={fetchImages.bind(null,"next")}>next</div>
            }
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