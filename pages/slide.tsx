import firebaseApp from "../components/fire"
import { getFirestore,collection, query, orderBy, QuerySnapshot, onSnapshot } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import {getAuth, onAuthStateChanged} from 'firebase/auth'
import { useState,useEffect,useRef } from "react";

import { useRouter } from "next/router";
import { ImageInfo } from "../components/GetImages";

import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react' //カルーセル用のタグをインポート
import { Pagination, Navigation,Autoplay,Lazy} from 'swiper' //使いたい機能をインポート
import 'swiper/css/bundle'

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp);

type FileInfo={
  thumbFilePath:string
  previewFilePath:string
  id:string
}

/**
 * 画像情報を格納した配列と、それが完了するPromiseの配列tasksを返す
 */
 const genFetchUrlTasks=(snapshot:QuerySnapshot)=>{
  // 順番通りに画像情報を格納するための配列
  const fileInfoList:FileInfo[]=[]
  // imlistにsetする前の画像情報を格納するための仮の配列
  const tmpImList: ImageInfo[] = [];
  // Promiseの配列
  const tasks: Array<Promise<string|void>> = [];

  // 配列の要素全てを取り出し、file情報を順番通りにfileInfoListに格納
  snapshot.docChanges().forEach((change)=>{
    if (change.type=="added"){
      const doc=change.doc.data()
      if (doc.thumbFilePath && doc.filePath){
        fileInfoList.push(
          {
            thumbFilePath:doc.thumbFilePath,
            previewFilePath:doc.filePath,
            id:change.doc.id
          }
        )
      }
    }
  });

  // 配列のforEachではインデックス番号が取得できるので、
  // 処理の順番が違っても順番通りにtmpImListに格納できる
  // そしてそれらのPromiseをtasksに格納
  fileInfoList.forEach((fileInfo,index)=>{
    tmpImList[index]={
      id:fileInfo.id,
      thumbUrl:"",
      previewUrl:"",
      valid:true
    }

    // サムネイル画像URL取得処理
    tasks.push(getDownloadURL(ref(storage,fileInfo.thumbFilePath))
      .then((thumbUrl:string)=>{
        tmpImList[index]={
          ...tmpImList[index],
          thumbUrl:thumbUrl
        }
      },()=>{        
        tmpImList[index]={
          ...tmpImList[index],
          valid:false
        } 
      })
    )

    // プレビュー画像URL取得処理
    tasks.push(getDownloadURL(ref(storage,fileInfo.previewFilePath))
      .then((previewUrl:string)=>{
        tmpImList[index]={
          ...tmpImList[index],
          previewUrl:previewUrl
        }
      },()=>{        
        tmpImList[index]={
          ...tmpImList[index],
          valid:false
        } 
      })
    )
  })

  return Promise.all(tasks).then(()=>tmpImList)
}

export default function Home(){
  const [imList, setImlist] = useState<ImageInfo[]>([])
  const [authLoading,setAuthLoading]=useState<boolean>(true)
  const [curIndex,setCurIndex]=useState<number>(0)
  const router=useRouter()
  const stateCurIndex=useRef<number>()
  stateCurIndex.current=curIndex

  // 画像をonSnapshotで差分取得する
  const fetchImage=()=>{
    console.log("start fetch images")
    // collection()が失敗するかもしれないのでtry~catchで囲む
    try{
      // collectionへの参照を取得
      const photoRef = collection(db, "photos");
      // 写真をアップロード日降順で取得(最新のが1番上に)
      const photoQuery = query(photoRef, orderBy("timeCreated","desc"));
      // 更新をサブスクライブする
      const unsubscribe = onSnapshot(
        photoQuery,
        (snapshot)=>{
          genFetchUrlTasks(snapshot)
          .then((tmpImList) => {
            // コールバック関数内では最新のhookにアクセスできないので、
            // useRefのcurrentを使う。
            // https://stackoverflow.com/questions/57847594/react-hooks-accessing-up-to-date-state-from-within-a-callback
            setImlist((prevList)=>[
              ...prevList.slice(0,stateCurIndex.current),
              ...tmpImList,
              ...prevList.slice(stateCurIndex.current)
            ])
            setAuthLoading(false)
          })// end Promise
        },
        (error)=>{
          console.log(error)
          router.push('/login')
        } // end Callback
      ) // end onSnapshot
      // useEffectのreturnに関数を渡すことで、
      // unmount時に関数を実行するので、
      // unmount時にlistenを止めるためにunsubscribeを返す
      return unsubscribe
    }catch(error){
      console.log(error)
      router.push('/login')
    }
  }
  
  useEffect(()=>{
    return onAuthStateChanged(auth,(user)=>{    
      if (user == null){
        router.push('/login')
      }else{
        return fetchImage()
      }// end else
    })//end onAuthState
  },[])
  
  // swiperの中で表示するSwiperSlide要素のリストを作成する
  const slidelist=imList.map((item:ImageInfo)=>{
    if (item.valid){
      return <SwiperSlide key={item.id}>
        <Image 
          src={item.previewUrl} 
          height="500" 
          width="500"
          objectFit="contain"
          layout="responsive"
          alt="" 
          unoptimized={true}
        />
      </SwiperSlide>
    }
  })

  return <div>
  <style jsx>{`
    .slideContent{
      position: relative;
    }

    .slideContent::before{
      content: "";
      display: block;
      padding-top: 50%;
      width: 100%;
    }

    .slideContent>div{
      // border: solid #000 2px;
      position: absolute; // 浮かせる
      width: 90%; // 親要素の90%
      height: 90%; // 親要素の90%
      top: 5%;
      left: 5%;
    }
  `}</style>
  <div className={`row g-0 align-items-center justify-content-center`}>
  <div className={`col-11 col-lg-11 slideContent`} >  
  <div>
    <Swiper
      onSlideChange={(e) => {
        setCurIndex(e.realIndex)
      }}
      modules={[Navigation, Pagination,Autoplay,Lazy]}
      slidesPerView={2} //一度に表示するスライドの数
      // pagination={{
      //   clickable: true,
      // }} //　何枚目のスライドかを示すアイコン、スライドの下の方にある
      // navigation //スライドを前後させるためのボタン、スライドの左右にある
      loop={true}
      lazy={true}
      // 5秒でスライド、操作したらスライドを停止する機能をoff
      autoplay={{delay:3000,disableOnInteraction:false}}
    >
      {slidelist}
    </Swiper>
  </div>
  </div>
  </div>
  </div> 
}