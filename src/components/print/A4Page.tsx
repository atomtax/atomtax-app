import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function A4Page({ children, className = '' }: Props) {
  return <div className={`a4-page ${className}`}>{children}</div>
}
