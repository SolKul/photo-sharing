import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import Image from 'next/image'
import loadImage,{LoadImageOptions }from 'blueimp-load-image';

import firebaseApp from "./fire"
import styles from '../styles/Home.module.scss'

const storage = getStorage(firebaseApp)

const c = "abcdefghijklmnopqrstuvwxyz0123456789";
const cl = c.length;

export default function UploadLayer({storeUrl,findFile}:any){
  const [modalAppear, setModalAppear] = useState<boolean>(false)
  const [btnAppear, setBtnAppear] = useState<boolean>(true)
  const [uploading, setUploading] = useState<boolean>(false);

  const openModal=(e:any)=>{
    setModalAppear(true)
    setBtnAppear(false)
  }

  const closeModal=()=>{
    setModalAppear(false)
    setBtnAppear(true)
  }

  const startUpload=()=>{
    setUploading(true)
    setModalAppear(false)
  }

  const endUpload=(e:any)=>{
    storeUrl()
    setUploading(false)
    setBtnAppear(true)
  }

  return <div>
    <UploadModal 
      modalAppear={modalAppear}
      closeModal={closeModal}
      startUpload={startUpload}
      endUpload={endUpload}
      findFile={findFile} 
    />
    {
      btnAppear
        &&
      <UploadBtn openModal={openModal} />
    }{
      uploading
        &&
      <UploadStatusBar />
    }
  </div>
}

const UploadModal=({ 
    modalAppear,
    closeModal,
    startUpload,
    endUpload,
    findFile }: any) =>{
  const [imageUrl, setImageUrl] = useState<string>("")
  const [clickable, setClickable] = useState(false);
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

  /**
   * 受け取った画像を圧縮し、Exifのorientationを反映した画像blobを生成
   * 詳しくはblueimp-load-imageのリポジトリ、特にdemo.jsを参照
   */
  const convertFiletoBlob=(file:File)=>{
    setFileName(file.name)

    const options:LoadImageOptions={
      maxWidth: 600,
      maxHeight: 600,
      canvas:true
    };

    loadImage(
      file,
      (canvas)=>{
        // optionでcanvas:trueとしているので、コールバック関数の引数はcanvasのはず。
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
    // async magic goes here...
    if (!blobedImage) {
      console.error(`not an image, the image file is a ${typeof (blobedImage)}`)
    } else {
      startUpload()
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
          checkUpload(randFileName).then(
            ()=>{
              clearState()
              endUpload()
            }
          )
        }
      )
    }
  }

  const checkUpload=async (fileName:string)=>{
    for (let i =0; i<5; i++){
      await new Promise(resolve => setTimeout(resolve, 3000))
      let success = await findFile(fileName)
      if (success){
        break;
      }
    }
  }

  const clearState=()=>{
    setImageUrl("")
    setClickable(false)
  }

  const cancelModal=()=>{
    clearState()
    closeModal()
  }

  return <div>
    {
      modalAppear
        &&
      <div className={styles.modalOverlay} onClick={cancelModal}>
        <div className={`row g-0 align-items-center justify-content-center ${styles.modalContent}`}>
          {/* ここでg-0を指定しないと、子要素のdivが横長になってしまう */}
          <div className={`col-10 col-lg-5 rounded ${styles.upload_modal}`} onClick={(e: any) => e.stopPropagation()}>
            <UploadSection 
              clickable={clickable}
              imageUrl={imageUrl}
              handleFileChange={handleFileChange}
              handleFireBaseUpload={handleFireBaseUpload}
            />
          </div>
        </div>
      </div>
    }
  </div>
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
          accept='image/*'
          onChange={handleFileChange}
        />
        <button disabled={!clickable} className="btn btn-primary">アップロード</button>
      </form>
    </div>
    {
      imageUrl
        ? 
      <div className={styles.upload_preview}>
        {/* upload_preview　が 70:100なので、210:300とする */}
        <Image 
          src={imageUrl}
          height="210" 
          width="300"
          objectFit="contain" 
          layout="responsive"
          alt="" 
          unoptimized={true}
        />
      </div>
        :
      "※圧縮してアップロードするのでギガを気にせずアップロードできます！" 
    }
    </div>
}

const UploadBtn=({openModal}:any)=>{
  return <div className={`btn ${styles.fixed_btn}`} onClick={openModal}>
  <img className={styles.plus_circular_btn} src="./plus-circular-button.svg"></img>
</div>;
}

const UploadStatusBar=()=>{
  return <div className={`row justify-content-center ${styles.fixed_upload_status}`}>
    <div className='col-10 col-lg-5'>アップロード中…</div>
  </div>
}