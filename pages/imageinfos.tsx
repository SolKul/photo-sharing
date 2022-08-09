import { useEffect } from "react";

import { ImageIdList } from "../components/ImageList";
import { useImages } from "../components/GetImages"
import { useRouter } from "next/router";

export default function Home(){
  const {imgList,isLoading,isError,existPrevPage,existNextPage,authAndFetchImages,fetchImages}=useImages(10)
  const router=useRouter()

  useEffect(()=>{
    authAndFetchImages()
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
        <ImageIdList imgList={imgList} />
        {
          existPrevPage
            &&
          <div onClick={fetchImages.bind(null,"prev")}>prev</div>
        }
        {
          existNextPage
            &&
          <div onClick={fetchImages.bind(null,"next")}>next</div>
        }
      </div>
    }
  </div>
}