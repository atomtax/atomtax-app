import type { Metadata } from 'next'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: '부가가치세 보고서',
}

export default function VatReportPage() {
  return (
    <div>
      <Header title="부가가치세 보고서" subtitle="Phase 4에서 구현 예정" />
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 shadow-sm">
        부가가치세 보고서는 Phase 4에서 구현됩니다.
      </div>
    </div>
  )
}
