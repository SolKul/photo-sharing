//firebase関係
import firebaseApp from "../components/fire"
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import {getAuth, onAuthStateChanged} from 'firebase/auth'

const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp);

import Image from 'next/image'
import loadImage,{LoadImageOptions }from 'blueimp-load-image';

import React, { useState,useEffect,useRef} from 'react';
import { useRouter } from "next/dist/client/router";

type blobedImageObject={
  fileName:string
  imageUrl:string
  blobedImage:Blob
}

const groupDir="groups/"

export default function Home(){
  const [uploadDir,setUploadDir]=useState<string>(groupDir)
  const [bImgArray,setBImgArray]=useState<blobedImageObject[]>([])
  // 0:まだ写真を選んでいない
  // 1:写真圧縮中
  // 2:アップロード準備完了
  const [imgStatus,setImgStatus]=useState<number>(0)
  const router = useRouter()
  const fileRef=useRef<HTMLInputElement>(null)
  
  // Eventの型は一回間違えてからエラーが出たところに
  // VSCode上でオーバーレイしてヒントを出すとわかる。
  // また、FooBarHandlerとなっている関数の引数の型はそのFooBarの部分
  // 例：ChangeEventHandlerの場合、引数の型はChangeEventの部分
  /**
   * 画像がセットされたときの関数。Blob画像をBImgArrayにセットする
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImgStatus(1)
    setBImgArray([])
    const files = e.target && e.target.files
    if (!files) return;
    convertFiletoBlob(files)
    .then((tmpBImgArray) => {
      setBImgArray(tmpBImgArray)
      setImgStatus(2)
    })// end then
  }

  /**
   * 受け取った複数画像をExifのorientationを反映しつつ
   * 圧縮したBlob画像の配列を返すPromiseを返す
   * 詳しくはblueimp-load-imageのリポジトリ、特にdemo.jsを参照
   */
  const convertFiletoBlob=(files:FileList)=>{
    const tmpBImgArray:blobedImageObject[]=[]
    const imgLoadTasks:Promise<void>[]=[]    
    const length=Math.min(files.length,16)
    for (let i=0;i<length;i++){
      const options:LoadImageOptions={
        maxWidth: 600,
        maxHeight: 600,
        canvas:true
      };

      imgLoadTasks.push(
        loadImage(
          files[i],
          options
        ).then((data)=>{
          const canvas=data.image
          // optionでcanvas:trueとしているので、コールバック関数の引数はcanvasのはず。
          const isCanvas = window.HTMLCanvasElement && canvas instanceof HTMLCanvasElement
          if (!isCanvas){
            console.error("Loading image file failed")
            return
          }
          // コールバックをPromiseで待てるようにする
          return new Promise<void> ((resolve)=>{
            canvas.toBlob(
              (blob)=>{
                if (!blob) return
                tmpBImgArray[i]={
                  fileName:files[i].name,
                  imageUrl:URL.createObjectURL(blob),
                  blobedImage:blob
                }
                resolve()
              },//end callback
              'image/jpeg'
            )//end toBlob
          }) // end Promise
        })// end then
      )//end imgLoadTasks.push
    }// end for

    // 全ての圧縮が完了したら、resolveし、
    // Blob画像の配列を返すようなPromiseを返す
    return Promise.all(imgLoadTasks).then(()=>tmpBImgArray)
  }

  const handleFireBaseUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const uploadTasks=bImgArray.map((bImgO:blobedImageObject)=>{
      // async magic goes here...
      if (!bImgO.blobedImage) {
        console.error(`not an image, the image file is a ${typeof (bImgO.blobedImage)}`)
      } else {
        const storageRef = ref(storage, `/${uploadDir}${bImgO.fileName}`)
        const uploadTask = uploadBytesResumable(storageRef, bImgO.blobedImage)
        //initiates the firebase side uploading 
        return new Promise<void>((resolve,reject)=>{
          uploadTask.on('state_changed',
            () => {}, 
            (err) => {
              //catches the errors
              console.log(err)
              reject()
            }, () => {
              resolve()
            }
          )// end on
        })//end Promise
      } //end else
    }) //end forEach
    Promise.all(uploadTasks).then(()=>{
      clearState()
      if(fileRef.current)fileRef.current.value=""
    })
  }

  const handleInputChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    setUploadDir(`${groupDir}${e.target.value}/`)
  }

  const clearState=()=>{
    setBImgArray([])
    setImgStatus(0)
  }

  useEffect(()=>{
    return onAuthStateChanged(auth,(user)=>{    
      if (user == null){
        router.push('/login')
      }
    })//end onAuthState
  },[])

  return <div>
  <div className={`row g-0 align-items-center justify-content-center`}>
  {/* ここでg-0を指定しないと、子要素のdivが横長になってしまう */}
  <div className={`col-11 col-lg-5 rounded `} >
    <div className="p-3">
    <form className="form-group" onSubmit={handleFireBaseUpload}>
      <label>アップロードディレクトリの指定</label>
      <input className="form-control mb-1"
          // allows you to reach into your file directory and upload image to the browser
          type="input"
          required={true}
          onChange={handleInputChange}
      />
      <input className="form-control-file mb-1"
        // allows you to reach into your file directory and upload image to the browser
        type="file"
        accept='image/*'
        onChange={handleFileChange}
        multiple
        ref={fileRef}
      />
      <button disabled={imgStatus!=2} className="btn btn-primary">アップロード</button>
    </form>
    </div>
    アップロードディレクトリ:{uploadDir}
    <ImageSection imgStatus={imgStatus} bImgArray={bImgArray} />
  </div>
  </div>
  </div>
}

type ImageSectionProps={
  imgStatus:number
  bImgArray:blobedImageObject[]
}

const ImageSection=({imgStatus,bImgArray}:ImageSectionProps)=>{
  

  let gridCol:string;
  if (bImgArray.length<=1){
    gridCol="col-12"
  }else if(bImgArray.length<=4){
    gridCol="col-6"
  }else if(bImgArray.length<=9){
    gridCol="col-4"
  }else{
    gridCol="col-3"
  }

  const multiImages=bImgArray.map((bImgO:blobedImageObject)=>
    <div className={`${gridCol}`} key={bImgO.fileName}>
      <div>
      {/* upload_preview　が 70:100なので、210:300とする */}
      <Image 
        src={bImgO.imageUrl}
        height="210" 
        width="300"
        objectFit="contain" 
        layout="responsive"
        alt="" 
        unoptimized={true}
      />
      </div>
    </div>
  )

  if(imgStatus == 0){
    return <div>
      <style jsx>{`
        .full{
          height: 100%
        }
      `}</style>
      ※16枚まで同時にアップロードできます
    </div>
  }else if(imgStatus==1){
    return <div className="d-flex justify-content-center align-items-center full">
      {/* 高さを親要素の100%とすることで、上下中央寄せができる */}
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  }else{
    return <div className="row g-1 align-items-center full">
      {multiImages}
    </div>
  }
}