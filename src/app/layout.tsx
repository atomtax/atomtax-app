import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '아톰세무회계',
  description: '아톰세무회계 내부 업무 시스템',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
