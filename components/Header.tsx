import Link from 'next/link'

type Props={
  header:any
}

export default function Header({header}:Props){
  return (
    <div>
      <Link href="/">
        <a>
        <div className="bg-primary px-3 text-white display-4">
          <h1>{header}</h1>
        </div>
        </a>
      </Link>
    </div>
  )
}