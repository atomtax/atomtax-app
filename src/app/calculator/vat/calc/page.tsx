import type { Metadata } from 'next'
import { VatCalculatorClient } from './VatCalculatorClient'

export const metadata: Metadata = {
  title: '부가가치세 계산',
}

export default function VatCalculatorCalcPage() {
  return (
    <div className="space-y-6">
      <header
        className="rounded-2xl text-white p-6 shadow"
        style={{
          background: 'var(--brand-grad)',
        }}
      >
        <h1 className="text-xl font-bold">
          🏢 건물분 부가가치세 계산기
          <span className="ml-2 text-sm font-normal opacity-80">
            by 아톰세무회계
          </span>
        </h1>
        <p className="text-sm opacity-90 mt-1">
          매매사업자용 부가가치세 자동 계산 도구
        </p>
      </header>

      <VatCalculatorClient />
    </div>
  )
}
