import Header from '@/components/layout/Header'
import { getTraderManagers, getTraderReviewData } from '@/lib/db/trader-review'
import { TraderReviewClient } from './TraderReviewClient'

interface SearchParams {
  year?: string
  manager?: string
}

export default async function TraderReviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const currentYear = new Date().getFullYear()
  const year = Number.parseInt(sp.year ?? String(currentYear - 1), 10)
  const manager = sp.manager?.trim() || undefined

  const [rows, managers] = await Promise.all([
    getTraderReviewData({ year, manager }),
    getTraderManagers(),
  ])

  return (
    <div className="space-y-4">
      <Header
        title="매매사업자 결산참고 (종합소득세)"
        subtitle="업종코드 703011/703012 — 양도/기말재고 자동 집계 + 메모/확인 저장"
      />
      <TraderReviewClient
        initialRows={rows}
        managers={managers}
        year={year}
        manager={manager}
      />
    </div>
  )
}
