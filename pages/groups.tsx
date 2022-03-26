// firebase関係
import firebaseApp from "../components/fire"
import { getFirestore,collection, query, QuerySnapshot, getDocs } from "firebase/firestore";
import { getStorage, ref,listAll, getDownloadURL } from 'firebase/storage'
import {getAuth, onAuthStateChanged} from 'firebase/auth'

import { useState,useEffect } from "react";
import { useRouter } from "next/dist/client/router";

import { Swiper, SwiperSlide } from 'swiper/react' //カルーセル用のタグをインポート
import { Pagination, Navigation,Lazy} from 'swiper' //使いたい機能をインポート


import Layout from '../components/Layout'
import Image from 'next/image'
import 'swiper/css/bundle'

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp);

type FileInfo={
  thumbFilePath:string
  previewFilePath:string
  id:string
}

type GroupImInfo={
  id:string
  url:string
}

const groupDir="groups/"
const introGroups=["test_group","test_group2"]

export default function Home(){
  const [gInfoList,setGInfoList]=useState<any>()
  const [authLoading,setAuthLoading]=useState<boolean>(true)
  const router=useRouter()

  const fetchGroupInfo=()=>{
    const GroupInfoQuery= query(collection(db, "groups")) 
    const tmpGroupInfo:any={}
    getDocs(GroupInfoQuery).then((snapshot:QuerySnapshot)=>{
      snapshot.forEach((document)=>{
        const doc=document.data()
        tmpGroupInfo[doc.dirName]={
          explanation:doc.explanation,
          table:doc.table
        }
      })
      setGInfoList(tmpGroupInfo)
    })
  }
  
  const groupIntros=introGroups.map((item:any)=>{
    if (gInfoList && (item in gInfoList)){
      return <GroupIntroduction 
        key={item}
        dirName={item} 
        explanation={gInfoList[item].explanation} 
        table={gInfoList[item].table} 
      />
    }
  })
  
  useEffect(()=>{
    return onAuthStateChanged(auth,(user)=>{    
      if (user == null){
        router.push('/login')
      }else{
        fetchGroupInfo()
      }// end else
    })//end onAuthState
  },[])

  return <div>
    <Layout header='Photo Sharing' title='Photo Sharing' href="/">
      グループ紹介ページ
    {/* <div className={`row g-0 align-items-center justify-content-center`}> */}
    {/* <div className={`col-11 col-lg-5 slideContent`} >   */}
    {/* <div> */}
      {groupIntros}
    {/* </div> */}
    {/* </div> */}
    {/* </div>  */}
    </Layout>
  </div>
}

const GroupIntroduction=({dirName,explanation,table}:any)=>{
  const [imList, setImList] = useState<GroupImInfo[]>([])

  // dirName以下の画像をlistAllで取得する
  const fetchImage=async (dirName:string)=>{
    console.log("start fetch images")
    // collection()が失敗するかもしれないのでtry~catchで囲む
    try{
      // collectionへの参照を取得
      const groupRef = ref(storage, `${groupDir}${dirName}`);
      const res=await listAll(groupRef)      
      const tasks: any[] = [];
      const tmpImList:any[]=[]

      res.items.forEach((itemRef: any) => {
        // 画像URLを取得、保存するPromiseを生成し、
        // そのPromiseをひとまとまりにする。
        tasks.push(getDownloadURL(itemRef)
          .then((fireBaseUrl: string) => {
            tmpImList.push(
              {
                id: itemRef,
                url: fireBaseUrl
              }
            )
          })
        )
      })
      // 複数のpromiseを待つ
      return Promise.all(tasks).then(() => tmpImList)
    }catch(error){
      console.log(error)
      throw error
    }
  }

  // swiperの中で表示するSwiperSlide要素のリストを作成する
  const slideList=imList.map((item:GroupImInfo)=>{
    return  <SwiperSlide key={item.id}>
      <Image 
        src={item.url} 
        height="500" 
        width="500"
        objectFit="contain"
        layout="responsive"
        alt="" 
        unoptimized={true}
      />
    </SwiperSlide>
  })

  useEffect(()=>{
    fetchImage(dirName).then(
      (tmpImList)=>{
        setImList(tmpImList)
      }
    )
  },[])

  return <div className="testClasss">
    <style jsx>{`
      .testClasss{
        border: solid #000 2px;
        height:100 
      }
      .slideContent{
        position: relative;
      }

      .slideContent::before{
        content: "";
        display: block;
        padding-top: 100%;
        width: 100%;
      }

      .slideContent>div{
        border: solid #000 2px;
        position: absolute; // 浮かせる
        width: 90%; // 親要素の90%
        height: 90%; // 親要素の90%
        top: 5%;
        left: 5%;
      }
    `}</style>
    テーブル: {table}
    <Swiper
      modules={[Navigation,Pagination,Lazy]}
      slidesPerView={1} //一度に表示するスライドの数
      pagination={{
        clickable: true,
      }} //　何枚目のスライドかを示すアイコン、スライドの下の方にある
      navigation //スライドを前後させるためのボタン、スライドの左右にある
      loop={true}
      lazy={true}
    >
      {slideList}
    </Swiper>
    {explanation}
    </div>
}