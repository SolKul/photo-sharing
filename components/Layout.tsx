import Head from 'next/head'
import Header from './Header'

export default function Layout({children,title,header,href="/"}:any){
  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      <Header header={header} href={href}/>
      {children}
    </div>
  )
}