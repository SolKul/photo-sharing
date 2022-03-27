import Head from 'next/head'
import Header from './Header'

export default function Layout({children,title,header,href="/"}:any){
  return (
    <div>
      <Head>
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Amatic+SC&display=swap" rel="stylesheet" />
      </Head>
      <Header header={header} href={href}/>
      {children}
    </div>
  )
}