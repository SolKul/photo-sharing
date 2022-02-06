import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import Image from 'next/image'

import firebaseApp from "../components/fire"
import styles from '../styles/Home.module.scss'

const storage = getStorage(firebaseApp)

export default function UploadModal({ show, setShow, setRelist,findFile }: any) {
  const [imageAsFile, setImageAsFile] = useState<File|null>(null)
  const [blobUrl, setBlobUrl] = useState<string>("")
  const [clickable, setClickable] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Eventの型は一回間違えてからエラーが出たところに
  // VSCode上でオーバーレイしてヒントを出すとわかる。
  // また、FooBarHandlerとなっている関数の引数の型はそのFooBarの部分
  // 例：ChangeEventHandlerの場合、引数の型はChangeEventの部分
  const handleImageAsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = e.target.files
    if (! files.length) return;
    try{
      setImageAsFile((imageFile: File|null) => (files[0]))
      setClickable(true)
      handlePreview(files[0])
    }catch(error){
      console.error(error)
    } 
  }

  const handlePreview = (file: File) => {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setBlobUrl(reader.result as string);
    };
  };

  const closeModal = () => {
    setIsLoading(false)
    setBlobUrl("")
    setClickable(false)
    setShow(false)
  }

  const handleFireBaseUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('start of upload')
    setIsLoading(true)
    // async magic goes here...
    if (imageAsFile === null || imageAsFile === undefined) {
      console.error(`not an image, the image file is a ${typeof (imageAsFile)}`)
      setIsLoading(false)
    } else {
      const storageRef = ref(storage, `/photos/${imageAsFile.name}`)
      const uploadTask = uploadBytesResumable(storageRef, imageAsFile)
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
          endUpload(imageAsFile.name)
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
    setRelist(true)
    closeModal()
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
            <UploadContent 
              handleFireBaseUpload={handleFireBaseUpload} 
              handleImageAsFile={handleImageAsFile}
              clickable={clickable}
              blobUrl={blobUrl}
            />
          }
        </div>
      </div>
    </div>
  } else {
    return null;
  }
}

const UploadContent = ({handleFireBaseUpload,handleImageAsFile,clickable,blobUrl}:any)=>{
  return  <div className="p-3">
    <div className={styles.upload_form}>
      <form className="form-group" onSubmit={handleFireBaseUpload}>
        <input className="form-control-file mb-1"
          // allows you to reach into your file directory and upload image to the browser
          type="file"
          onChange={handleImageAsFile}
        />
        <button disabled={!clickable} className="btn btn-primary">アップロード</button>
      </form>
    </div>
    {
      blobUrl
        && 
      <div className={styles.upload_preview}>
        <Image 
          src={blobUrl}
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