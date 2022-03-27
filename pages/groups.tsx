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

type GroupInfo={
  [key:string]:{
    table:string
    relation:string
    explanation:string
  }
}

const tableLayoutImage="groups/tableLayout.png"
const groupDir="groups/"
const groomGroups=["test_group","test_group2"]
const brideGroups=["test_group","test_group2"]

export default function Home(){
  const [gInfoList,setGInfoList]=useState<GroupInfo>()
  const [authLoading,setAuthLoading]=useState<boolean>(true)
  const [tableLOUrl,setTableLOUrl]=useState<string>("")
  const router=useRouter()

  const fetchTableLOImage=()=>{
    getDownloadURL( ref(storage, tableLayoutImage))
      .then((url)=>{
        setTableLOUrl(url)
    })
  }

  const fetchGroupInfo=()=>{
    const GroupInfoQuery= query(collection(db, "groups")) 
    const tmpGroupInfo:GroupInfo={}
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
  
  const groomGroupIntros=groomGroups.map((item)=>{
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

  const brideGroupIntros=brideGroups.map((item)=>{
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
        fetchTableLOImage()
        fetchGroupInfo()
      }// end else
    })//end onAuthState
  },[])

  return <div>
    <Layout header='T&amp;M Wedding' title='T&amp;M Wedding' href="/">
    <div className={`row g-0 align-items-center justify-content-center`}>
    <div className={`col-11 col-lg-5 slideContent`} >  
    <h2 className="my-3">ゲスト紹介</h2>
      <h4 className="my-1">テーブルレイアウト</h4>
      {
        tableLOUrl
          &&
        <Image 
          src={tableLOUrl}
          height="300" 
          width="500"
          objectFit="contain"
          layout="responsive"
          alt="" 
          unoptimized={true}
        />
      }
    <h3 className="my-3">新郎ゲスト</h3>
    {groomGroupIntros}
    <h3 className="my-3">新婦ゲスト</h3>
    {brideGroupIntros}
    </div>
    </div> 
    <PhotoBtn />
    </Layout>
  </div>
}

type GroupIntroductionProps={
  dirName:string
  table:string
  relation:string
  explanation:string
}

const GroupIntroduction=({dirName,table,relation,explanation}:GroupIntroductionProps)=>{
  const [imList, setImList] = useState<GroupImInfo[]>([])

  // dirName以下の画像をlistAllで取得する
  const fetchImage=async (dirName:string)=>{
    console.log("start fetch images")
    // ref()が失敗するかもしれないのでtry~catchで囲む
    try{
      // collectionへの参照を取得
      const groupRef = ref(storage, `${groupDir}${dirName}`);
      const res=await listAll(groupRef)      
      const tasks: Array<Promise<string|void>> = [];
      const tmpImList:GroupImInfo[]=[]

      let count = 0;

      res.items.forEach((itemRef) => {
        // 画像URLを取得、保存するPromiseを生成し、
        // そのPromiseをひとまとまりにする。
        tasks.push(getDownloadURL(itemRef)
          .then((fireBaseUrl: string) => {
            tmpImList.push(
              {
                id: String(count),
                url: fireBaseUrl
              }
            )
            console.log(`count: ${count}`)
            count++;
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

const PhotoBtn=()=>{
  const router = useRouter()

  return <div className="btn" onClick={()=>{router.push("/")}}>
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
    <img className="circleBtn" src="./photo.svg"></img>
  </div>
}