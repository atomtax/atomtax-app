import Header from '@/components/layout/Header'
import { getActiveManagers, getReviewData } from '@/lib/db/income-tax-review'
import { PersonalReviewClient } from './PersonalReviewClient'

interface SearchParams {
  year?: string
  manager?: string
}

export default async function PersonalReviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const currentYear = new Date().getFullYear()
  const year = Number.parseInt(sp.year ?? String(currentYear - 1), 10)
  const manager = sp.manager?.trim() || undefined

  const [rows, managers] = await Promise.all([
    getReviewData({ year, manager }),
    getActiveManagers(),
  ])

  return (
    <div className="space-y-4">
      <Header
        title="일반사업자 결산참고 (종합소득세)"
        subtitle="활성 개인사업자 — 보고서 자동 조회 + 메모/확인 저장"
      />
      <PersonalReviewClient
        initialRows={rows}
        managers={managers}
        year={year}
        manager={manager}
      />
    </div>
  )
}
