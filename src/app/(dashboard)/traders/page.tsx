import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { listTraderClientsGroupedByManager } from '@/lib/db/trader-properties'
import { TraderBulkUpload } from '@/components/traders/TraderBulkUpload'
import { TraderSearchFilter } from '@/components/traders/TraderSearchFilter'

export default async function TradersListPage() {
  const groups = await listTraderClientsGroupedByManager()
  const totalCount = groups.reduce((sum, g) => sum + g.clients.length, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-indigo-600" />
            매매사업자 데이터
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            업종코드 703011, 703012 · 총 {totalCount}개 사업자
          </p>
        </div>
        <TraderBulkUpload />
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        매매사업자 목록은 고객 관리에서 <strong>업종코드 703011, 703012</strong>로 자동 표시됩니다.{' '}
        고객 정보는{' '}
        <Link href="/clients" className="underline">
          고객 관리
        </Link>
        에서 수정하세요. 물건 데이터를 한 번에 등록하려면 우측{' '}
        <strong>[양식 다운로드] → 입력 → [일괄 업로드]</strong> 사용 (사업자등록번호로 자동 매칭).
      </div>

      <TraderSearchFilter groups={groups} />
    </div>
  )
}
