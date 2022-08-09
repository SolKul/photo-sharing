import { useState,useEffect } from "react";

import Layout from '../components/Layout'
import UploadLayer from "../components/UploadLayer";
import { ImageList} from "../components/ImageList";
import { useImages,TargetType } from "../components/GetImages"
import { useRouter } from "next/router";

export default function Home(){
  const router=useRouter()
  const {imgList,isLoading,isError,existPrevPage,existNextPage,authAndFetchImages,fetchImages}=useImages(30)

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
            <UploadLayer fetchImages={fetchImages}/>
            <NextPrev existPrevPage={existPrevPage} existNextPage={existNextPage} fetchImages={fetchImages} />
            </div>
          }
        </div>
        <GuestBtn/>
      </Layout>
    </div>
  )
}

const NextPrev=(
  {existPrevPage,existNextPage,fetchImages}:{existPrevPage:boolean,existNextPage:boolean,fetchImages:(target:TargetType)=>void})=>{
  return <div className="row">
    <style jsx>{`
      .font{
        font-family: 'Amatic SC', cursive;
        font-weight: 700;
      }
    `}</style>
    <div className="col-2"><p className="text-end font h3" onClick={fetchImages.bind(null,"first")}>&lt;&lt;</p></div>
    <div className="col-3">
      {
        existPrevPage
          &&
        <p className="text-end font h3" onClick={fetchImages.bind(null,"prev")}>&lt;prev</p>
      }
    </div>
    <div className="col-1"></div>
    <div className="col-5">
      {
        existNextPage
          &&
        <p className="text-start font h3" onClick={fetchImages.bind(null,"next")}>next&gt;</p>
      }
    </div>
  </div>
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