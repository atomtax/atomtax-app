import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '아톰세무회계 계산기',
  description: '매매사업자 부가가치세 자동 계산기',
}

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <main className="container mx-auto px-4 py-10 max-w-3xl">{children}</main>
    </div>
  )
}
