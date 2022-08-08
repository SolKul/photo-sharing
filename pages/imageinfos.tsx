import { useEffect } from "react";

import { ImageIdList } from "../components/ImageList";
import { userImages } from "../components/GetImages"
import UploadLayer from "../components/UploadLayerMod"
import { useRouter } from "next/router";

export default function Home(){
  const {imgList,isLoading,isError,startFetchImages}=userImages()
  const router=useRouter()

  useEffect(()=>{
    startFetchImages()
  },[])

  useEffect(()=>{
    isError && router.push("/login")
  },[isError])

  return <div>
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
        <ImageIdList imlist={imgList} />
        <UploadLayer />
      </div>
    }
  </div>
}