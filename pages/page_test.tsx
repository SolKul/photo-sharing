import { useEffect } from "react"
import {genDummyList,useReadList,DummyData} from "../components/genDummyInfo"

export default function Home(){
  const {
    dataList,
    listLoading,
    existNextPage,
    existPrevPage,
    readPage
  }=useReadList(10)

  const writeData=()=>{
    genDummyList()
  }

  useEffect(
    readPage.bind(null,"first"),
    []
  )

  return <div>
    <div onClick={writeData}>Write Data</div>
    <div onClick={readPage.bind(null,"first")}>Read Data</div>
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
      <div onClick={readPage.bind(null,"backward")}>prev</div>
    }
    {
      existNextPage
        &&
      <div onClick={readPage.bind(null,"forward")}>next</div>
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