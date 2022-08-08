import { useState } from "react";

import Image from 'next/image'

import styles from '../styles/Home.module.scss'

import {ImageInfo} from "./GetImages"
import {PreviewModal,idAndUrl} from "./PreviewModal"

type ImageListProps = {
  imgList: ImageInfo[]
}

// idのみ列挙するコンポーネント
export const ImageIdList = ({ imgList }: ImageListProps) => {
  // imgListプロパティの要素数が 0 であれば何も描画しない
  if (imgList.length == 0) return null;

  // imgListからitemを取り出し、item.idとitem.urlを組み込んで
  // li要素配列を生成する。
  const listItems = imgList.map((item: ImageInfo) =>
    <li key={item.id}>
      id: {item.id}
      url: {item.previewUrl}
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
export const ImageList = ({ imgList }: ImageListProps) => {
  const [show, setShow] = useState<boolean>(false)
  const [idAndUrl, setIdAndUrl] = useState<idAndUrl>({id:"",url:""})

  // imgListプロパティの要素数が 0 であれば何も描画しない
  if (imgList.length == 0) return null;

  const openModal =(id:string,previewUrl:string)=>{
    setIdAndUrl({
      id:id,
      url:previewUrl
    })
    setShow(true)
  }

  // imgListからitemを取り出し、item.idとitem.urlを組み込んで
  // 配列を生成する。
  const listItems = imgList.map((item: ImageInfo) =>{
    if (item.valid){
      return <div key={item.id} className="col-4 col-lg-3">
        <div onClick={()=>openModal(item.id,item.previewUrl)}>
          <Image 
            src={item.thumbUrl} 
            height="300" 
            width="300"
            objectFit="contain" 
            layout="responsive"
            alt="" 
            unoptimized={true}
          />
        </div>
      </div>
    }
  });

  return <div>
    <div className={`row g-0 ${styles.square}`}>
      {/* ここでg-0を指定しないと、子要素のdivが横長になってしまう */}
      {listItems}
    </div>
    <PreviewModal show={show} setShow={setShow} idAndUrl={idAndUrl}/>
  </div>
}