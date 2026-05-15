import type { Metadata } from 'next'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: '결산참고 - 부가가치세',
}

export default function VatReviewPage() {
  return (
    <div>
      <Header title="부가가치세 결산참고" subtitle="다음 단계에서 구현 예정" />
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 shadow-sm">
        부가가치세 결산참고는 다음 단계에서 구현됩니다.
      </div>
    </div>
  )
}
