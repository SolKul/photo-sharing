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
const groomGroups=["test_group","test_group2"]
const brideGroups=["test_group","test_group2"]

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
          table:doc.table,
          relation:doc.relation,
          explanation:doc.explanation
        }
      })
      setGInfoList(tmpGroupInfo)
    })
  }
  
  const groomGroupIntros=groomGroups.map((item:any)=>{
    if (gInfoList && (item in gInfoList)){
      return <GroupIntroduction 
        key={item}
        dirName={item} 
        table={gInfoList[item].table} 
        relation={gInfoList[item].relation}
        explanation={gInfoList[item].explanation} 
      />
    }
  })

  const brideGroupIntros=brideGroups.map((item:any)=>{
    if (gInfoList && (item in gInfoList)){
      return <GroupIntroduction 
        key={item}
        dirName={item} 
        table={gInfoList[item].table} 
        relation={gInfoList[item].relation}
        explanation={gInfoList[item].explanation}  
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
      <h2 className="my-3">グループ紹介ページ</h2>
      <h4 className="my-1">テーブルレイアウト</h4>
      <Image 
        src="/tableLayout.png"
        height="300" 
        width="500"
        objectFit="contain"
        layout="responsive"
        alt="" 
        unoptimized={true}
      />
    {/* <div className={`row g-0 align-items-center justify-content-center`}> */}
    {/* <div className={`col-11 col-lg-5 slideContent`} >   */}
    {/* <div> */}
      <h3 className="my-3">新郎グループ</h3>
      {groomGroupIntros}
      <h3 className="my-3">新婦グループ</h3>
      {brideGroupIntros}
    {/* </div> */}
    {/* </div> */}
    {/* </div>  */}
    </Layout>
  </div>
}

const GroupIntroduction=({dirName,table,relation,explanation}:any)=>{
  const [imList, setImList] = useState<GroupImInfo[]>([])

  // dirName以下の画像をlistAllで取得する
  const fetchImage=async (dirName:string)=>{
    console.log("start fetch images")
    // ref()が失敗するかもしれないのでtry~catchで囲む
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
    <h4 className="my-2">{relation} </h4>
    <h5>テーブル: {table}</h5>
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
    <h6 className="m-2">{explanation}</h6>
    </div>
}