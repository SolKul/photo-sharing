import { useEffect, useState } from "react"
import {genDummyList,useReadList,DummyData} from "../components/genDummyInfo"

export default function Home(){
  const {
    dataList,
    listLoading,
    existNextPage,
    existPrevPage,
    readFirst,
    movePage
  }=useReadList(10)

  const writeData=()=>{
    genDummyList()
  }

  useEffect(
    ()=>{readFirst()},
    []
  )

  return <div>
    <div onClick={writeData}>Write Data</div>
    <div onClick={readFirst}>Read Data</div>
    {
      listLoading
        ?
      <div>Loading...</div>
        :
      <div>
        <DataList dataList={dataList}/>
      </div>
    }
    {
      existPrevPage
        &&
      <div onClick={movePage.bind(null,"backward")}>prev</div>
    }
    {
      existNextPage
        &&
      <div onClick={movePage.bind(null,"forward")}>next</div>
    }
  </div>
}


/**
 * idとdataが保存されたオブジェクトのリスト
 * @param param0 
 * @returns 
 */
export const DataList = ({ dataList }: {dataList:DummyData[]}) => {

  if (dataList.length == 0) return null;

  // imlistからitemを取り出し、item.idとitem.urlを組み込んで
  // li要素配列を生成する。
  const listItems = dataList.map((item: DummyData) =>
    <li key={item.id}>
      id: {item.id} data: {item.data}
    </li>
  );

  return <div>
    <ul>
      {listItems}
    </ul>
  </div>
}