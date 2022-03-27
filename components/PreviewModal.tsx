import firebaseApp from "../components/fire"
import { getFirestore,doc,setDoc } from "firebase/firestore";
import {SetStateAction,useState} from "react"
import Image from 'next/image'

const db = getFirestore(firebaseApp);

export type idAndUrl={
  id:string
  url:string
}

type PreviewModalProps = {
  show: boolean
  setShow: React.Dispatch<SetStateAction<boolean>>
  idAndUrl:idAndUrl
}

export const PreviewModal=({show,setShow,idAndUrl}:PreviewModalProps)=>{
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const closeModal = () => {
    setIsLoading(true)
    setShow(false)
  }

  const deleteImage=(e:any)=>{
    e.stopPropagation()
    const answer = confirm("写真を削除しますか？")
    if (answer){
      setDoc(
        doc(db,"photos",idAndUrl.id),
        {visibility:false},
        { merge: true }
      )
      closeModal()
    }
  }

  if (show) {
    return <div className="modalOverlay" onClick={closeModal}>
      <style jsx>{`
        .modalOverlay{
          /*　画面全体を覆う設定　*/
          position:fixed;
          top:0;
          left:0;
          width:100%;
          height:100%;
          background-color:rgba(0,0,0,0.5);
          z-index: 2;
        }

        /* 画像を正方形内で表示するための設定 */
        .modalContent{
          z-index:3;
          height: 100%;
          padding: 1em;
        }

        .modalContent>div {
          position:relative;
        }

        .modalContent>div::before {
          content: "";
          display: block;
          padding-top: 100%;
          width: 100%;
        }

        .modalContent>div>div{
          position: absolute; // 浮かせる
          width: 100%; // 親要素の100%
          height: 100%; // 親要素の100%
          top: 0%;
          left: 0%;
        }

        .darkWhite{
          background-color: #EEE;
        }

        .btn{
          z-index:3;
          position: fixed;
          bottom: 1rem; 
          left: 1rem;
        }
        
        .circleBtn{
          width: 3rem;
          height: 3rem;
        }
      `}</style>
      <div className="row g-0 align-items-center justify-content-center modalContent">
      <div className="col-11 col-lg-5 darkWhite" onClick={(e:React.MouseEvent<HTMLElement>) => e.stopPropagation()}>  
        {
          idAndUrl.url!=""
            &&
          <div>
            <Image 
              src={idAndUrl.url} 
              width={500}
              height={500}
              objectFit="contain" 
              layout="responsive"
              alt="" 
              unoptimized={true}
              onLoadingComplete={(e)=>{setIsLoading(false)}}
            />
          </div>
        }
        {/* ロード中は以下を表示しておく */}
        {
          isLoading
            &&
          <div className="d-flex justify-content-center align-items-center">
            {/* 高さを親要素の100%とすることで、上下中央寄せができる */}
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          </div>
        } 
      </div>
      </div>
      <div className="btn" onClick={deleteImage}>
        <img className="circleBtn" src="./gabage.svg"></img>
      </div>
    </div>
  } else {
    return null;
  }
}