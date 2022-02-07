import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import Image from 'next/image'
import loadImage,{LoadImageOptions }from 'blueimp-load-image';

import firebaseApp from "../components/fire"
import styles from '../styles/Home.module.scss'

const storage = getStorage(firebaseApp)

const c = "abcdefghijklmnopqrstuvwxyz0123456789";
const cl = c.length;

export default function UploadModal({ show, setShow, storeUrl,findFile }: any) {
  const [imageUrl, setImageUrl] = useState<string>("")
  const [clickable, setClickable] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName,setFileName]=useState<string>("")
  const [blobedImage,setBlobedImage]=useState<Blob>()

  // Eventの型は一回間違えてからエラーが出たところに
  // VSCode上でオーバーレイしてヒントを出すとわかる。
  // また、FooBarHandlerとなっている関数の引数の型はそのFooBarの部分
  // 例：ChangeEventHandlerの場合、引数の型はChangeEventの部分
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target && e.target.files && e.target.files[0]
    if (!file) return;
    convertFiletoBlob(file)
  }

  const convertFiletoBlob=(file:File)=>{
    setFileName(file.name)

    const options:LoadImageOptions={
      maxWidth: 600,
      maxHeight: 600,
      canvas:true
    };

    // blueimp-load-image: https://github.com/blueimp/JavaScript-Load-Image
    loadImage(
      file,
      (canvas)=>{
        const isCanvas = window.HTMLCanvasElement && canvas instanceof HTMLCanvasElement
        if (!isCanvas){
          console.error("Loading image file failed")
          return
        }
        canvas.toBlob((blob)=>{
          if (!blob) return
          setBlobedImage(blob)
          setImageUrl(URL.createObjectURL(blob))
          setClickable(true)
        },
        'image/jpeg')
      },
      options
    )

  }

  const handleFireBaseUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('start of upload')
    setIsLoading(true)
    // async magic goes here...
    if (!blobedImage) {
      console.error(`not an image, the image file is a ${typeof (blobedImage)}`)
      setIsLoading(false)
    } else {

      var r = "";
      for(var i=0; i<5; i++){
        r += c[Math.floor(Math.random()*cl)];
      }

      const randFileName=`${r}_${fileName}`

      const storageRef = ref(storage, `/photos/${randFileName}`)
      const uploadTask = uploadBytesResumable(storageRef, blobedImage)
      //initiates the firebase side uploading 
      //https://firebase.google.com/docs/storage/web/upload-files?hl=ja#monitor_upload_progress
      //このドキュメントだけ呼んだだけだと分かりにくいが、
      //uploadTask.onの第1引数に'state_changed'を指定すると
      //第2、第3、第4引数に渡した関数で
      // アップロード状況を管理することができる。
      uploadTask.on('state_changed',
        (snapShot: any) => {
          //takes a snap shot of the process as it is happening
          console.log(snapShot)
        }, (err: any) => {
          //catches the errors
          console.log(err)
        }, () => {
          endUpload(randFileName)
        }
      )
    }
  }

  const endUpload=async (fileName:string)=>{
    for (let i =0; i<5; i++){
      await new Promise(resolve => setTimeout(resolve, 3000))
      let success = await findFile(fileName)
      if (success){
        break;
      }
    }
    storeUrl()
    closeModal()
  }

  const closeModal = () => {
    setIsLoading(false)
    setImageUrl("")
    setClickable(false)
    setShow(false)
  }

  if (show) {
    return <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={`row g-0 align-items-center justify-content-center ${styles.modalContent}`}>
        {/* ここでg-0を指定しないと、子要素のdivが横長になってしまう */}
        <div className={`col-10 rounded ${styles.upload_modal}`} onClick={(e: any) => e.stopPropagation()}>
          {
            isLoading
              ?
            <div className={`d-flex justify-content-center align-items-center`}>
            {/* 高さを親要素の100%とすることで、上下中央寄せができる */}
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            </div>
              : 
            <UploadSection 
              clickable={clickable}
              imageUrl={imageUrl}
              handleFileChange={handleFileChange}
              handleFireBaseUpload={handleFireBaseUpload}
            />
          }
        </div>
      </div>
    </div>
  } else {
    return null;
  }
}

const UploadSection = ({
    clickable,
    imageUrl,
    handleFileChange,
    handleFireBaseUpload
  }:any)=>{
  return  <div className="p-3">
    <div className={styles.upload_form}>
      <form className="form-group" onSubmit={handleFireBaseUpload}>
        <input className="form-control-file mb-1"
          // allows you to reach into your file directory and upload image to the browser
          type="file"
          onChange={handleFileChange}
        />
        <button disabled={!clickable} className="btn btn-primary">アップロード</button>
      </form>
    </div>
    {
      imageUrl
        && 
      <div className={styles.upload_preview}>
        <Image 
          src={imageUrl}
          height="210" 
          width="300"
          objectFit="contain" 
          layout="responsive"
          alt="" 
        />
      </div>
    }
    </div>
}