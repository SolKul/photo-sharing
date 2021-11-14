import { useState,useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import {getAuth} from 'firebase/auth'

import Layout from '../components/Layout'
import firebaseApp from "../components/fire"
import { useRouter } from 'next/dist/client/router';

const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp);

const Index = () => {
  const [message,setMessage]=useState("wait ...")
  const router = useRouter()

  useEffect(()=>{
    if (auth.currentUser == null){
      router.push('/')
    }else{
      setMessage('logined ' + auth.currentUser.displayName)
    }
  },[])

  return (
    <div>
      <Layout header='Photo Sharing' title='Upload page'>
        <p>{message}</p>
        <Upload />
      </Layout>
    </div>
  )
}

// 型定義
type AllInputsType = {
  imgUrl: string
}

const Upload = () => {
  const allInputs = { imgUrl: '' }
  const [imageAsFile, setImageAsFile] = useState<any>('')
  const [imageAsUrl, setImageAsUrl] = useState<AllInputsType>(allInputs)

  // Eventの型は一回間違えてからエラーが出たところに
  // VSCode上でオーバーレイしてヒントを出すとわかる。
  // ただanyでいいかも。
  const handleImageAsFile = (e: any) => {
    console.log(e)
    const image = e.target.files[0]
    setImageAsFile((imageFile: any) => (image))
  }

  const handleFireBaseUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('start of upload')
    // async magic goes here...
    if (imageAsFile === '' || imageAsFile === undefined) {
      console.error(`not an image, the image file is a ${typeof (imageAsFile)}`)
    } else {
      const storageRef=ref(storage,`/images/${imageAsFile.name}`)
      const uploadTask = uploadBytesResumable(storageRef,imageAsFile)
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
              //オブジェクトのスプレッド構文による展開と、値の更新
              //{imgUrl: 古いURL}を{imgUrl: 新しいURL}に更新している。
              //https://qiita.com/FumioNonaka/items/58358a29850afd7a0f37
              setImageAsUrl(prevObject => ({ ...prevObject, imgUrl: fireBaseUrl }))
            })
        })
    }
  }

  return <div>
    <form className="form-group" onSubmit={handleFireBaseUpload}>
      <input className="form-control-file mb-1"
        // allows you to reach into your file directory and upload image to the browser
        type="file"
        onChange={handleImageAsFile}
      />
      <button className="btn btn-primary">アップロード</button>
    </form>
    <img src={imageAsUrl.imgUrl} alt="image tag" />
  </div>
};

export default Index