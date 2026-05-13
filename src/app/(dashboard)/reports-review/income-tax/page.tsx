import Link from 'next/link'
import { ArrowRight, Building2, Users } from 'lucide-react'
import Header from '@/components/layout/Header'

export default function IncomeTaxReviewBranchPage() {
  return (
    <div>
      <Header
        title="종합소득세 결산참고"
        subtitle="분야를 선택하세요"
      />
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/reports-review/income-tax/personal"
          className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <Users size={24} />
            </div>
            <ArrowRight
              size={18}
              className="text-gray-400 group-hover:text-indigo-600 transition-colors"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mt-4">
            일반사업자 참고
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            개인사업자 거래처 결산 현황 (담당자별 / 연도별)
          </p>
        </Link>

        <Link
          href="/reports-review/income-tax/trader"
          className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <Building2 size={24} />
            </div>
            <ArrowRight
              size={18}
              className="text-gray-400 group-hover:text-indigo-600 transition-colors"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mt-4">
            매매사업자 참고
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            매매사업자(703011/703012) 결산 현황 (양도/기말재고 자동 집계)
          </p>
        </Link>
      </div>
    </div>
  )
}
