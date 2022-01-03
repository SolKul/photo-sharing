import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

import firebaseApp from "../components/fire"
import styles from '../styles/Home.module.scss'

const storage = getStorage(firebaseApp)

export default function UploadModal({ show, setShow, setRelist }: any) {
  const [imageAsFile, setImageAsFile] = useState<any>("")
  const [imageAsUrl, setImageAsUrl] = useState<string>("")

  // Eventの型は一回間違えてからエラーが出たところに
  // VSCode上でオーバーレイしてヒントを出すとわかる。
  // ただanyでいいかも。
  const handleImageAsFile = (e: any) => {
    console.log(e)
    const image = e.target.files[0]
    setImageAsFile((imageFile: any) => (image))
  }

  const closeModal = () => {
    setShow(false)
  }

  const handleFireBaseUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('start of upload')
    // async magic goes here...
    if (imageAsFile === '' || imageAsFile === undefined) {
      console.error(`not an image, the image file is a ${typeof (imageAsFile)}`)
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
          // gets the functions from storage refences the image storage in firebase by the children
          // gets the download url then sets the image from firebase as the value for the imgUrl key:
          getDownloadURL(uploadTask.snapshot.ref)
            .then(fireBaseUrl => {
              setImageAsUrl(fireBaseUrl)
              setTimeout(
                () => {
                  setShow(false)
                  setRelist(true)
                },3000)
            })
        })
    }
  }

  if (show) {
    return <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={`row align-items-center justify-content-center ${styles.modalContent}`}>
        <div className={`col-10 rounded ${styles.upload_modal}`} onClick={(e: any) => e.stopPropagation()}>
          <div className="p-4">
            <form className="form-group" onSubmit={handleFireBaseUpload}>
              <input className="form-control-file mb-1"
                // allows you to reach into your file directory and upload image to the browser
                type="file"
                onChange={handleImageAsFile}
              />
              <button className="btn btn-primary">アップロード</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  } else {
    return null;
  }
}

