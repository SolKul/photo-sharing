import { useEffect, useState } from "react";

import Image from 'next/image'

import styles from '../styles/Home.module.scss'

export type ImageInfo = {
  id: string
  thumbUrl: string
  previewUrl:string
}

type ImageListProps = {
  imlist: ImageInfo[]
}

// idのみ列挙するコンポーネント
export const ImageIdList = ({ imlist }: ImageListProps) => {
  // imlistプロパティの要素数が 0 であれば何も描画しない
  if (imlist.length == 0) return null;

  // imlistからitemを取り出し、item.idとitem.urlを組み込んで
  // li要素配列を生成する。
  const listItems = imlist.map((item: ImageInfo) =>
    <li key={item.id}>
      id: {item.id}
    </li>
  );

  return <div>
    <ul>
      {listItems}
    </ul>
  </div>
}

// ImageListコンポーネントはurlの配列を受け取って
// li要素を生成し、instagram風に並べるコンポーネント
export const ImageList = ({ imlist }: ImageListProps) => {
  const [show, setShow] = useState<boolean>(false)
  const [modalUrl, setModalUrl] = useState<string>("")

  // imlistプロパティの要素数が 0 であれば何も描画しない
  if (imlist.length == 0) return null;

  const openModal =(previewUrl:string)=>{
    setModalUrl(previewUrl)
    setShow(true)
  }

  // imlistからitemを取り出し、item.idとitem.urlを組み込んで
  // li要素配列を生成する。
  const listItems = imlist.map((item: ImageInfo) =>
    <div key={item.id} className="col-4 col-lg-3">
      <div onClick={()=>openModal(item.previewUrl)}>
        <Image 
          src={item.thumbUrl} 
          height="300" 
          width="300"
          objectFit="contain" 
          layout="responsive"
          alt="" 
        />
      </div>
    </div>
  );

  return <div>
    <div className={`row g-0 ${styles.square}`}>
      {/* ここでg-0を指定しないと、子要素のdivが横長になってしまう */}
      {listItems}
    </div>
    <PreviewModal show={show} setShow={setShow} modalUrl={modalUrl}/>
  </div>
}

const PreviewModal=({show,setShow,modalUrl}:any)=>{
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const closeModal = () => {
    setIsLoading(true)
    setShow(false)
  }

  if (show) {
    return <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={`row g-0 align-items-center justify-content-center ${styles.modalContent}`}>
      <div className={`col-11 col-lg-5 ${styles.white}`} onClick={(e:any) => e.stopPropagation()}>  
        {
          modalUrl!=""
            &&
          <div>
            <Image 
              src={modalUrl} 
              width={500}
              height={500}
              objectFit="contain" 
              layout="responsive"
              alt="" 
              onLoadingComplete={(e)=>{setIsLoading(false)}}
            />
          </div>
        }
        {/* ロード中は以下を表示しておく */}
        {
          isLoading
            &&
          <div className={`d-flex justify-content-center align-items-center`}>
            {/* 高さを親要素の100%とすることで、上下中央寄せができる */}
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          </div>
        } 
      </div>
      </div>
    </div>
  } else {
    return null;
  }
}