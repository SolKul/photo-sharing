import Link from 'next/link'

import styles from '../styles/Home.module.scss'

type Props={
  header:any
  href?:string
}

export default function Header({header,href="/"}:Props){
  return (
    <div>
    <style jsx>{`
      .pointer {
        cursor:pointer;
      }

      .bg-midori{
        background-color:#87b960;
      }

      .font{
        font-family: 'Amatic SC', cursive;
      }
    `}</style>
      <Link href={href}>
        <div className="bg-midori px-3 text-white display-4 pointer">
          <h1 className='font'>{header}</h1>
        </div>
      </Link>
    </div>
  )
}