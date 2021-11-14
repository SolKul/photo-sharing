import styles from '../styles/Home.module.scss'
import Link from 'next/link'

import Layout from '../components/Layout'

export default function Home(){

  const item_list=[]
  for (let i=0;i<5;i++){
    item_list.push(
    <div className="col-4 col-lg-3">
      <div>col-4</div>
    </div>)
  }

  return (
    <div>
      <Layout header='Photo Sharing' title='Top page.'>
        <p>This is sample</p>
        <div>
        <Link href="/upload">
          <a>Upload Page</a>
        </Link>
        </div>
        <div>
        <Link href="/list">
          <a>List Page</a>
        </Link>
        </div>
        <div className={`row g-0 ${styles.square}`}>
          {item_list}
        </div>
      </Layout>
    </div>
  )
}