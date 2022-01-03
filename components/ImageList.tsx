import { useState } from "react";

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
        <Image src={item.thumbUrl} objectFit="contain" layout="fill" alt="" />
      </div>
    </div>
  );

  return <div>
    <div className={`row g-0 ${styles.square}`}>
      {listItems}
    </div>
    <PreviewModal show={show} setShow={setShow} modalUrl={modalUrl}/>
  </div>
}

const PreviewModal=({show,setShow,modalUrl}:any)=>{
  const closeModal = () => {
    setShow(false)
  }

  if (show) {
    return <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={`row align-items-center justify-content-center ${styles.modalContent}`}>
      <div className={`col-8 ${styles.white}`} onClick={(e:any) => e.stopPropagation()}>
        <div>
        {
          modalUrl!="" 
          && 
          <Image 
            src={modalUrl} 
            layout="fill" 
            objectFit="contain" 
            alt="" 
          />
        }
        </div>
      </div>
      </div>
    </div>
  } else {
    return null;
  }
}