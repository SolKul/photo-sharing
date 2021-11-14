import Image from 'next/image'

import styles from '../styles/Home.module.scss'

export type ImageInfo = {
  id: string
  url: string
}

type ImageListProps = {
  imlist: ImageInfo[]
}

// idのみ列挙するコンポーネント
export const ImageIdList = ({ imlist }: ImageListProps) => {
  // imlistプロパティの要素数が 0 であれば何も描画しない
  if (imlist.length == 0) return null;

  // imlistからitemを取り出し、item.idとitem.urlを組み込んで
  // li要素配列を生成する。
  const listItems = imlist.map((item: ImageInfo) =>
    <li key={item.id}>
      id: {item.id}
    </li>
  );

  return <div>
    <ul>
      {listItems}
    </ul>
  </div>
}

// ImageListコンポーネントはurlの配列を受け取って
// li要素を生成し、instagram風に並べるコンポーネント
export const ImageList = ({ imlist }: ImageListProps) => {
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