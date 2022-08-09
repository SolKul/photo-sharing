import Head from 'next/head'
import { ReactNode } from 'react'
import Header from './Header'

type LayoutProps={
  children:ReactNode
  title:string
  header:string
  href?:string
}

export default function Layout({children,title,header,href="/"}:LayoutProps){
  return (
    <div>
      <Head>
        <title>{title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&display=swap" rel="stylesheet" />
      </Head>
      <Header header={header} href={href}/>
      {children}
    </div>
  )
}