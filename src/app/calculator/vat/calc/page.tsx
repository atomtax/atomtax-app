import { VatCalculatorClient } from './VatCalculatorClient'

export default function VatCalculatorCalcPage() {
  return (
    <div className="space-y-6">
      <header
        className="rounded-2xl text-white p-6 shadow"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <h1 className="text-xl font-bold">🏢 건물분 부가가치세 계산기</h1>
        <p className="text-sm opacity-90 mt-1">
          매매사업자용 부가가치세 자동 계산 도구
        </p>
      </header>

      <VatCalculatorClient />
    </div>
  )
}
