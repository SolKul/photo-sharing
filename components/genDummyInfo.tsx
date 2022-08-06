import firebaseApp from "../components/fire"
import { 
  getFirestore,
  connectFirestoreEmulator,
  collection,
  setDoc,
  doc,
  query,
  getDocs,
  orderBy,
  limit,
  QueryDocumentSnapshot,
  DocumentData,
  startAfter,
  QuerySnapshot
} from "firebase/firestore";
import { useState } from "react";

const db = getFirestore(firebaseApp);
connectFirestoreEmulator(db, 'localhost', 8080);

const c = "abcdefghijklmnopqrstuvwxyz0123456789";
const cl = c.length;

/**
 * ダミーデータを何件か生成し、
 * FireStoreに登録する関数
 */
export const genDummyList=()=>{
  const dummyRef=collection(db, 'dummy');

  for (let i=1; i < 50; i++){
    let r = "";
    for(let j=0; j<5; j++){
      r += c[Math.floor(Math.random()*cl)];
    }
    const dummyData={
      id:i,
      data:r
    }
    setDoc(doc(dummyRef,dummyData.data),dummyData)
  }
}

export type DummyData={
  id:number,
  data:string
}

export type FirstLastDoc={
  first:QueryDocumentSnapshot<DocumentData>,
  last:QueryDocumentSnapshot<DocumentData>
}

type MoveDirection = "forward" | "backward";

type AdjacentPageSnapshot = {
  prev:QuerySnapshot<DocumentData>|null,
  next:QuerySnapshot<DocumentData>|null
}

const initAdjacentPageSnapshot={
  prev:null,
  next:null
}


/**
 * 指定した件数ずつデータを読み込み、
 * 次ページ、前ページを生成するカスタムフック
 * @param numLimit 1ページに何件表示するか
 * @returns dataList 読み込んだデータ
 * @returns listLoading データを読み込み中かどうか
 * @returns existNextPage 前ページがあるかどうか
 * @returns existPrevPage 次ページがあるかどうか
 * @returns readFirst 最初のページを読み込む関数
 * @returns movePage ページを移動する関数
 */
export function useReadList(numLimit:number){
  const [dataList,setDataList]=useState<DummyData[]>([])
  const [listLoading,setListLoading]=useState<boolean>(true)
  const [existNextPage,setExistNextPage] = useState<boolean>(false)
  const [existPrevPage,setExistPrevPage]= useState<boolean>(false)
  const [adjacentPageSnapshot,setAdjacentPageSnapshot]=useState<AdjacentPageSnapshot>(initAdjacentPageSnapshot)

  /**
   * 最初のページを読み込む関数。
   * 読み込みが完了するとlistLoadingがfalseとなる。
   * 続いて次のページのsnapshotをロードし、
   * adjacentPageSnapshotに保存する
   */
  const readFirst=async ()=>{
    setListLoading(true)
    setExistNextPage(false)
    setExistPrevPage(false)
    try{
      // dmmuyコレクションへの参照を取得する
      const dummyRef=collection(db, 'dummy');
      // 昇順でデータを取得する
      const dummyQuery=query(dummyRef,orderBy("id","asc"),limit(numLimit))
      // awaitでsnapshotを取得する
      const snapshot = await getDocs(dummyQuery)
      const tmpList:DummyData[]=[]
      // snapshotのそれぞれ(=データ1件ずつ)読み込み
      // tmpListにidとdataをオブジェクトとしてpushする
      snapshot.forEach(
        (document)=>{
          const doc = document.data()
          tmpList.push(
            {
              id:doc.id,
              data:doc.data
            }
          )
        }
      )
      // 読み込んだ結果tmpListをdataListフックに保存し
      // データ読み込み完了とする
      setDataList(tmpList)
      setListLoading(false)

      // 次のページをロードし、次のページががあるかないかをexistPrevPageに保存する
      // 最初のページを読み込んだはずなので、前のページはないはず
      loadAdjacentPage(snapshot,"forward","forward")
        .then((result)=>{setExistNextPage(result)})
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
    setListLoading(true)
    setExistNextPage(false)
    setExistPrevPage(false)
    try{
      const tmpList:DummyData[]=[]

      // ページ移動の方向が次か前かをtrueかfalseにする
      const forwardOrNot = moveDirection=="forward"
      // 次のページに移動する場合はadjacentPageSnapshot["next"]のsnapshotを取り出す。
      // 前のページに移動する場合はadjacentPageSnapshot["prev"]のsnapshotを取り出す。
      const adjacentPage = forwardOrNot ? "next" : "prev"
      const snapshot=adjacentPageSnapshot[adjacentPage]
      if (!snapshot){throw("error")}
      // snapshotのそれぞれ(=データ1件ずつ)読み込み
      // tmpListにidとdataをオブジェクトとしてpushする
      snapshot.forEach(
        (document)=>{
          const doc = document.data()
          tmpList.push(
            {
              id:doc.id,
              data:doc.data
            }
          )
        }
      )
      // 次のページに移動した場合はそのままの順序で、
      // 前のページに移動した場合は逆順にしてdataListに保存する
      forwardOrNot ? setDataList(tmpList) : setDataList(tmpList.reverse())
      setListLoading(false)

      // 前のページをロードし、前のページがあるかないかをexistPrevPageに保存する
      loadAdjacentPage(snapshot,moveDirection,"backward")
        .then((result)=>{setExistPrevPage(result)})
      // 次のページをロードし、次のページがあるかないかをexistPrevPageに保存する
      loadAdjacentPage(snapshot,moveDirection,"forward")
        .then((result)=>{setExistNextPage(result)})
    }catch(error){
      console.log(error)
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
  const loadAdjacentPage=async(
      oldSnapshot:QuerySnapshot<DocumentData>,
      oldMoveDirection:MoveDirection,
      moveDirection:MoveDirection)=>{
    try{
      const dummyRef=collection(db, 'dummy');

      // ページ移動の方向が次か前かをtrueかfalseにする
      const forwardOrNot = moveDirection=="forward"
      // 次のページに移動する場合はorderbyは昇順
      // 前のページに移動する場合はorderbyは降順でソートする
      const direction = forwardOrNot ? "asc" : "desc"
      // 次のページに移動する場合はadjacentPageSnapshot["next"]のsnapshot、
      // 前のページに移動する場合はadjacentPageSnapshot["prev"]のsnapshotを更新する
      const adjacentPage= forwardOrNot ? "next" : "prev"

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
      const dummyQuery=query(dummyRef,orderBy("id",direction),limit(numLimit),startAfter(startAfterTarget))
      const newSnapshot = await getDocs(dummyQuery)
      setAdjacentPageSnapshot(
        (prevAdjacentPageSnapshot)=>{
          prevAdjacentPageSnapshot[adjacentPage]=newSnapshot
          return prevAdjacentPageSnapshot
        }
      )
      return newSnapshot.docs.length>0
    }catch(error){
      console.error(error)
      return false
    }
  }

  return {dataList,listLoading,existNextPage,existPrevPage,readFirst,movePage}
}

