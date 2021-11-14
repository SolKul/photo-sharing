import Image from 'next/image'
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage'
import { useEffect, useState } from 'react'

import styles from '../styles/Home.module.scss'
import firebaseApp from "../components/fire"
import Layout from '../components/Layout'

const storage = getStorage(firebaseApp)

// 拡張子チェック。ここを参照
// https://blog.ver001.com/javascript-get-extension/
function getExt(filename: string) {
  var pos = filename.lastIndexOf('.');
  if (pos === -1) return '';
  return filename.slice(pos + 1);
}

//許可する拡張子
var allow_exts = new Array('jpg', 'jpeg', 'png');

//ファイル名の拡張子が許可されているか確認する関数
function checkExt(filename: string) {
  //比較のため小文字にする
  var ext = getExt(filename).toLowerCase();
  //許可する拡張子の一覧(allow_exts)から対象の拡張子があるか確認する
  if (allow_exts.indexOf(ext) === -1) return false;
  return true;
}

// 配列データをコンポーネントに渡すやり方はここを参照
// https://maku.blog/p/av9mxak/
// idとurlを一緒にしたものの型
interface ImageInfo {
  id: number;
  url: string;
}

// ImageListに渡すpropsの型
interface ImageListProps {
  imlist: ImageInfo[]
}

const Index = () => {
  // useStateの初期値は必ず[]を指定。
  // useState()のままだと、undefinedが初期値となり、
  // 型が一致しないといわれてしまう。
  const [imlist, setImlist] = useState<ImageInfo[]>([])

  const store_url = () => {
    const temp_imlist: ImageInfo[] = [];
    let url = ""
    var listRef = ref(storage, "images")
    listAll(listRef)
      .then((res: any) => {
        const tasks: Array<any> = [];
        let count = 0;
        res.items.forEach((itemRef: any) => {
          console.log(itemRef)
          // もし画像ファイルだったら、
          if (checkExt(itemRef.name)) {
            // 画像URLを取得、保存するPromiseを生成し、
            // そのPromiseをひとまとまりにする。
            tasks.push(getDownloadURL(itemRef)
              .then((fireBaseUrl: string) => {
                temp_imlist.push(
                  {
                    id: count,
                    url: fireBaseUrl
                  }
                )
                count++;
              })
            )
          }
        })
        // 複数のpromiseを待つ
        // https://qiita.com/saka212/items/ff61a6de9c3e19810c5d
        Promise.all(tasks).then(() => {
          setImlist(temp_imlist)
        })
      })
  }

  useEffect(() => {
    // ページを読み込んだ時のみで画像urlを取得
    store_url()
  }, [])

  return (
    <div>
      <Layout header='Photo Sharing' title='Photo List page'>
        {/* ImageListコンポーネントに画像URLの配列を渡す */}
        <ImageList imlist={imlist} />
      </Layout>
    </div>
  )
}

export default Index

// ImageListコンポーネントはurlの配列を受け取って
// li要素を生成し、instagram風に並べるコンポーネント
const ImageList = ({ imlist }: ImageListProps) => {
  // imlistプロパティの要素数が 0 であれば何も描画しない
  if (imlist.length == 0) return null;

  // imlistからitemを取り出し、item.idとitem.urlを組み込んで
  // li要素配列を生成する。
  const listItems = imlist.map((item: ImageInfo) =>
    <div key={item.id} className="col-4 col-lg-3">
      <div><Image src={item.url} objectFit="contain" layout="fill" alt="" /></div>
    </div>
  );

  return <div>
    <div className={`row g-0 ${styles.square}`}>
      {listItems}
    </div>
  </div>
}