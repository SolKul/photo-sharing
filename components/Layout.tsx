import Head from 'next/head'
import Header from './Header'
import Footer from './Footer'

export default function Layout({children,title,header}:any){
  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      <Header header={header} />
      <div className="container">
        {children}
      </div>
      <Footer footer="This is footer" />
    </div>
  )
}