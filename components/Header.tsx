import Link from 'next/link'

import styles from '../styles/Home.module.scss'

type Props={
  header:any
  href?:string
}

export default function Header({header,href="/"}:Props){
  return (
    <div>
      <Link href={href}>
        <div className={"bg-primary px-3 text-white display-4 "+styles.pointer}>
          <h1>{header}</h1>
        </div>
      </Link>
    </div>
  )
}