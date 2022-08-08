import { useEffect } from "react";

import { ImageIdList } from "../components/ImageList";
import { useImages } from "../components/GetImages"
import { useRouter } from "next/router";

export default function Home(){
  const {imgList,isLoading,isError,existAdjacentPage,authAndFetchImages,fetchImages}=useImages()
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
        <ImageIdList imlist={imgList} />
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
}