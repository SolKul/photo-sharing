import { useState} from 'react';
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import Image from 'next/image'
import loadImage,{LoadImageOptions }from 'blueimp-load-image';

import firebaseApp from "./fire"
import styles from '../styles/Home.module.scss'

import { TargetType } from "../components/GetImages"

const storage = getStorage(firebaseApp)

const c = "abcdefghijklmnopqrstuvwxyz0123456789";
const cl = c.length;

export default function UploadLayer({fetchImages}:{fetchImages:(target:TargetType)=>void}){
  const [modalAppear, setModalAppear] = useState<boolean>(false)
  const [btnAppear, setBtnAppear] = useState<boolean>(true)
  const [uploading, setUploading] = useState<boolean>(false);

  const openModal=()=>{
    setModalAppear(true)
    setBtnAppear(false)
  }

  const closeModal=()=>{
    setBtnAppear(true)
    setModalAppear(false)
  }

  const startUpload=()=>{
    setUploading(true)
    setModalAppear(false)
  }

  const endUpload=()=>{
    setUploading(false)
    setBtnAppear(true)
    fetchImages("first")
  }

  return <div>
    <UploadModal 
      modalAppear={modalAppear}
      closeModal={closeModal}
      startUpload={startUpload}
      endUpload={endUpload}
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

type UploadModalProps={
  modalAppear:boolean
  closeModal:()=>void
  startUpload:()=>void
  endUpload:()=>void 
}

type blobedImageObject={
  fileName:string
  imageUrl:string
  blobedImage:Blob
}

const UploadModal=({ 
    modalAppear,
    closeModal,
    startUpload,
    endUpload }: UploadModalProps) =>{
  const [bImgArray,setBImgArray]=useState<blobedImageObject[]>([])
  // 0:まだ写真を選んでいない
  // 1:写真圧縮中
  // 2:アップロード準備完了
  const [imgStatus,setImgStatus]=useState<number>(0)
  
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
    const length=Math.min(files.length,9)
    for (let i=0;i<length;i++){
      const options:LoadImageOptions={
        maxWidth: 1200,
        maxHeight: 1200,
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
    startUpload()
    const uploadTasks=bImgArray.map((bImgO:blobedImageObject)=>{
      // async magic goes here...
      if (!bImgO.blobedImage) {
        console.error(`not an image, the image file is a ${typeof (bImgO.blobedImage)}`)
      } else {
        var r = "";
        for(let i=0; i<5; i++){
          r += c[Math.floor(Math.random()*cl)];
        }

        const randFileName=`${r}_${bImgO.fileName}`

        const storageRef = ref(storage, `/photos/${randFileName}`)
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
      setTimeout(
        ()=>{
          clearState()
          endUpload()
        },
        3000
      )
    })
  }

  const clearState=()=>{
    setBImgArray([])
    setImgStatus(0)
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
          <div className={`col-11 col-lg-5 rounded ${styles.upload_modal}`} onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}>
            <UploadSection 
              handleFileChange={handleFileChange}
              handleFireBaseUpload={handleFireBaseUpload}
              imgStatus={imgStatus}
              bImgArray={bImgArray}
            />
          </div>
        </div>
      </div>
    }
  </div>
}

type UploadSectionProps={
  handleFileChange:(e: React.ChangeEvent<HTMLInputElement>)=>void
  handleFireBaseUpload:(e:React.FormEvent<HTMLFormElement>)=>void
  imgStatus:number
  bImgArray:blobedImageObject[]
}

const UploadSection = ({
    handleFileChange,
    handleFireBaseUpload,
    imgStatus,
    bImgArray}:UploadSectionProps)=>{

  return  <div className="p-3">
    <style jsx>{`
      .btn-midori{
        background-color:#87b960;
      }
    `}</style>
    <div className={styles.upload_form}>
      <form className="form-group" onSubmit={handleFireBaseUpload}>
        <input className="form-control-file mb-1"
          // allows you to reach into your file directory and upload image to the browser
          type="file"
          accept='image/*'
          onChange={handleFileChange}
          multiple
        />
        <button disabled={imgStatus!=2} className="btn btn-midori text-white">アップロード</button>
      </form>
    </div>
    <div className={styles.upload_preview}>
      <ImageSection imgStatus={imgStatus} bImgArray={bImgArray} />
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
      ※圧縮してアップロードするので容量制限を気にせずアップロードできます！
      (1,000枚で0.4GB)
      <br />
      ※9枚まで同時にアップロードできます
    </div>
  }else if(imgStatus==1){
    return <div className={`d-flex justify-content-center align-items-center ${styles.full}`}>
      {/* 高さを親要素の100%とすることで、上下中央寄せができる */}
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  }else{
    return <div className={`row g-1 align-items-center ${styles.full}`}>
      {multiImages}
    </div>
  }
}

const UploadBtn=({openModal}:{openModal:()=>void})=>{
  return <div className="btn" onClick={openModal}>
    <style jsx>{`
      .btn{
        z-index:1;
        position: fixed;
        bottom: 1rem; 
        right: 1rem;
      }

      .circleBtn{
        width: 3rem;
        height: 3rem;
      }
    `}</style>
  <img className="circleBtn" src="./upload.svg"></img>
</div>;
}

const UploadStatusBar=()=>{
  return <div className={`row justify-content-center ${styles.fixed_upload_status}`}>
    <div className='col-10 col-lg-5'>アップロード中…</div>
  </div>
}