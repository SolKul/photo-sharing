import firebaseApp from "../components/fire"
import { useState,useEffect } from "react";

import { ImageIdList,ImageInfo } from "../components/ImageList";
import {fetchImage} from "../components/GetImagesMod"
import UploadLayer from "../components/UploadLayerMod"
import { useRouter } from "next/router";

export default function Home(){
  const [imList, setImlist] = useState<ImageInfo[]>([])
  const [authLoading,setAuthLoading]=useState<boolean>(true)
  const router=useRouter()

  useEffect(()=>{
    return fetchImage(setImlist,setAuthLoading,null)
  },[])

  return <div>
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
        <ImageIdList imlist={imList} />
        <UploadLayer />
      </div>
    }
  </div>
}