import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import { getClients } from '@/lib/db/clients'
import {
  fetchClosingChanges,
  fetchClosingChangeById,
  fetchLatestTpForBusiness,
  fetchWehagoByBusiness,
} from '@/lib/db/closing'
import ClosingPasteForm from './ClosingPasteForm'
import TpUploadForm from './TpUploadForm'
import ClosingChangesList from './ClosingChangesList'
import ClosingDetailPanel from './ClosingDetailPanel'

export const metadata: Metadata = {
  title: '아톰랩 · 마감감지',
}

export default async function ClosingPage({
  searchParams,
}: {
  searchParams: Promise<{ change?: string }>
}) {
  const { change: changeId } = await searchParams

  const [changes, clients] = await Promise.all([
    fetchClosingChanges(false),
    getClients(),
  ])

  const clientOptions = clients.map((c) => ({
    id: c.id,
    company_name: c.company_name,
    business_number: c.business_number,
  }))

  const selectedChange = changeId ? await fetchClosingChangeById(changeId) : null
  const [tp, wehago] = selectedChange
    ? await Promise.all([
        fetchLatestTpForBusiness(selectedChange.business_number),
        fetchWehagoByBusiness(selectedChange.business_number),
      ])
    : [null, null]

  return (
    <div>
      <Header
        title="마감감지 + 매출대조"
        subtitle="위하고 마감현황 변화 감지 + TP 매출 (Phase 7 · 실험)"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 왼쪽: 수집 + 결재 목록 */}
        <div className="space-y-6">
          <ClosingPasteForm />
          <TpUploadForm clients={clientOptions} />
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-2">
              확인 필요 ({changes.length})
            </h2>
            <ClosingChangesList changes={changes} selectedId={changeId} />
          </div>
        </div>

        {/* 오른쪽: 상세 패널 */}
        <div>
          {selectedChange ? (
            <ClosingDetailPanel change={selectedChange} tp={tp} wehago={wehago} />
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <div className="text-2xl mb-2">🔎</div>
              <div className="text-sm">
                왼쪽 목록에서 회사를 선택하면 매출대조·검증이 표시됩니다
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
