import firebaseApp from "../components/fire"
import { 
  getFirestore,
  collection, 
  query, 
  orderBy,
  QuerySnapshot,
  getDocs, 
  DocumentData,
  QueryDocumentSnapshot,
  limit,
  startAfter
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import {getAuth, onAuthStateChanged} from 'firebase/auth'
import { useState } from "react";

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp)
const auth = getAuth(firebaseApp)

export type ImageInfo = {
  id: string
  thumbUrl: string
  previewUrl:string
  valid:boolean
}

export type FirstLastDoc={
  first:QueryDocumentSnapshot<DocumentData>,
  last:QueryDocumentSnapshot<DocumentData>
}

type MoveDirection = "prev" | "next";

type AdjacentPageSnapshot = {
  prev:QuerySnapshot<DocumentData>|null,
  next:QuerySnapshot<DocumentData>|null
}

const initAdjacentPageSnapshot={
  prev:null,
  next:null
}

export type TargetType= "first" | MoveDirection

export type ExitAdjacentPage={
  prev:boolean,
  next:boolean
}

const falseExitAdjacentPage={
  prev:false,
  next:false
}

const usePagination=(numLimit:number)=>{
  const [existAdjacentPage,setExistAdjacentPage] = useState<ExitAdjacentPage>(falseExitAdjacentPage)
  const [adjacentPageSnapshot,setAdjacentPageSnapshot]=useState<AdjacentPageSnapshot>(initAdjacentPageSnapshot)

  // collectionへの参照を取得
  const photoRef = collection(db, "photos");

  /**
   * 最初のページまたは次、前のページを表示する
   * @param target どのページを表示するか
   */
   const readPage=(target:TargetType)=>{
    return target=="first" ? readFirst() : movePage(target)
  }

  /**
   * 最初のページを読み込む関数。
   * 読み込みが完了するとlistLoadingがfalseとなる。
   * 続いて次のページのsnapshotをロードし、
   * adjacentPageSnapshotに保存する
   */
   const readFirst=async ()=>{
    setExistAdjacentPage(falseExitAdjacentPage)
    try{
      // 写真をアップロード日降順で取得(最新のが1番上に)
      const photoQuery = query(photoRef, orderBy("timeCreated","desc"),limit(numLimit));
      // awaitでsnapshotを取得する
      const snapshot = await getDocs(photoQuery)

      // 次のページをロードし、次のページががあるかないかをexistPrevPageに保存する
      // 最初のページを読み込んだはずなので、前のページはないはず
      loadAdjacentPage(snapshot,"next","next")
      return snapshot
    }catch(error){
      throw(error)
    }

  }

  /**
   * ページを移動する。
   * 次ページ、または前ページのデータはあらかじめadjacentPageSnapshotに保存してあるので、
   * それを取り出して、dataListに保存する
   * 続いて前のページ、次のページのsnapshotをロードし、
   * adjacentPageSnapshotに保存する
   * @param moveDirection ページの移動方向
   */
   const movePage=async (moveDirection:MoveDirection)=>{
    setExistAdjacentPage(falseExitAdjacentPage)
    try{
      // 次のページに移動する場合はadjacentPageSnapshot["next"]のsnapshotを取り出す。
      // 前のページに移動する場合はadjacentPageSnapshot["prev"]のsnapshotを取り出す。
      const snapshot=adjacentPageSnapshot[moveDirection]
      if (!snapshot){return Promise.reject("error")}
      // snapshotのそれぞれ(=データ1件ずつ)読み込み
      // tmpListにidとdataをオブジェクトとしてpushする

      // 前のページをロードし、前のページがあるかないかをexistPrevPageに保存する
      loadAdjacentPage(snapshot,moveDirection,"prev")
      // 次のページをロードし、次のページがあるかないかをexistPrevPageに保存する
      loadAdjacentPage(snapshot,moveDirection,"next")
      return snapshot
    }catch(error){
      console.log(error)
      throw error
    }
  }


  /**
   * 隣接するページを読み込む
   * @param oldSnapshot 今表示しているsnapshot
   * @param oldMoveDirection 今のページ移動方向
   * @param moveDirection これから移動しようとしているページの移動方向
   * @returns 次のページのデータの読み込みが完了したら、
   * データが存在していればtrue、存在していなければfalseをresolveするPromise
   */
  const loadAdjacentPage=(
      oldSnapshot:QuerySnapshot<DocumentData>,
      oldMoveDirection:MoveDirection,
      moveDirection:MoveDirection)=>{
    try{
      if(oldSnapshot.docs.length==0) throw new Error("oldSnapshot empty")
      // 次のページに移動する場合はorderbyは昇順
      // 前のページに移動する場合はorderbyは降順でソートする
      const direction = moveDirection=="next" ? "desc" : "asc"

      // firestoreからデータを取得するqueryにおいて、
      // どこからデータを取得するstartAfterについて、
      // 今のページの移動方向と、これからのページの移動方向が同じであれば
      // snapshotの最後の要素からデータを取得し、
      // 今のページの移動方向と、これからのページの移動方向が逆であれば
      // snapshotの最初の要素からデータを取得する
      const startAfterTarget = (
        oldMoveDirection == moveDirection
          ?
            oldSnapshot.docs[oldSnapshot.docs.length-1]
          :
            oldSnapshot.docs[0]
      )
      const photoQuery = query(
        photoRef,
        orderBy("timeCreated",direction),
        limit(numLimit),
        startAfter(startAfterTarget)
      )
      getDocs(photoQuery).then((newSnapshot)=>{
        // 次のページに移動する場合はadjacentPageSnapshot["next"]のsnapshot、
        // prevExitAdjacentPage["next"]がtrueかfalseか、
        // 前のページに移動する場合はadjacentPageSnapshot["prev"]のsnapshot、
        // prevExitAdjacentPage["prev"]がtrueかfalseかを更新する
        setAdjacentPageSnapshot(
          (prevAdjacentPageSnapshot)=>{
            prevAdjacentPageSnapshot[moveDirection]=newSnapshot
            return { ... prevAdjacentPageSnapshot}
          }
        )
        setExistAdjacentPage((prevExitAdjacentPage)=>{
            prevExitAdjacentPage[moveDirection]=newSnapshot.docs.length>0
            return { ... prevExitAdjacentPage }
        })
      })
    }catch(error){
      console.error(error)
      setExistAdjacentPage((prevExitAdjacentPage)=>{
        prevExitAdjacentPage[moveDirection]=false
        return prevExitAdjacentPage
      })
    }
  }

  return {existAdjacentPage,readPage}
}


export const useImages=(numLimit:number)=>{
  const [imgList, setImglist] = useState<ImageInfo[]>([])
  const [isLoading,setIsLoading]=useState<boolean>(true)
  const [isError,setIsError]=useState<boolean>(false)
  const {existAdjacentPage,readPage}=usePagination(numLimit)

  /**
   * onAuthStateChangedに画像をロードする関数を与える
   * userがnullなら、isErrorをtrueにする
   */
  const authAndFetchImages=()=>{
    const unsub = onAuthStateChanged(auth,(user)=>{
      if (user==null){
        console.error("not logined")
        setIsError(true)
        unsub()
      }else{
        fetchImages("first")
      }
    })
  }

  /**
   * FireStore(データベース)を読み込み、
   * それをもとにStorageから画像ダウンロードURLが入った
   * 画像情報を格納した配列を返却するPromiseを返す関数
   */
  const fetchImages=(target:TargetType)=>{
    setIsLoading(true)
    readPage(target).then((snapshot)=>{
      return getDownUrls(snapshot)
    }).then((resImgList)=>{
      if (target == "prev"){
        setImglist(resImgList.reverse())
      }else{
        setImglist(resImgList)
      }
      setIsLoading(false)
    }).catch((error)=>{console.error(error)})
  }

  /**
   * FireStore(データベース)を読み込んだ結果であるsanpshotを受け取り、
   * それをもとに画像情報の取得を開始する。
   * 情報の取得が完了すると、画像情報を格納した配列を返却するPromiseを返す関数
   */
  const getDownUrls=(snapshot:QuerySnapshot)=>{
    // imlistにsetする前の画像情報を格納するための仮の配列
    const tmpImList: ImageInfo[] = [];
    // Promiseの配列
    const tasks: Array<Promise<string|void>> = [];

    // 配列の要素全てを取り出し、順番通りにtmpImListにダウンロードURLを格納
    let index=0
    snapshot.forEach((document)=>{
      pushDownUrlTask(document,tmpImList,tasks,index) && (index +=1)
    })

    return Promise.all(tasks).then(()=>tmpImList)
  }

  const pushDownUrlTask=(
    document:QueryDocumentSnapshot<DocumentData>,
    tmpImList:ImageInfo[],
    tasks:Promise<string|void>[],
    index:number
  )=>{
    const doc=document.data()
    if (!doc.thumbFilePath || !doc.filePath || !doc.visibility) return false
    tmpImList[index]={
      id:document.id,
      thumbUrl:"",
      previewUrl:"",
      valid:true
    }

    // サムネイル画像URL取得処理
    tasks.push(getDownloadURL(ref(storage,doc.thumbFilePath))
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
    tasks.push(getDownloadURL(ref(storage,doc.filePath))
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

    return true
  }

  return {imgList,isLoading,isError,existAdjacentPage,authAndFetchImages,fetchImages}
}