import type { Metadata } from 'next'
import { Suspense } from 'react'
import { listCorporateClientsWithReports, listCorporateManagers } from '@/lib/db/corporate-tax-reports'
import { CorporateTaxFilters } from '@/components/reports/CorporateTaxFilters'
import { CorporateTaxReportList } from '@/components/reports/CorporateTaxReportList'

export const metadata: Metadata = {
  title: '법인세 보고서',
}

interface Props {
  searchParams: Promise<{ year?: string; manager?: string; q?: string }>
}

export default async function CorporateTaxReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const currentYear = new Date().getFullYear()
  const year = Number(params.year) || currentYear - 1
  const manager = params.manager ?? 'all'
  const query = (params.q ?? '').trim()

  const [clientsWithReports, managers] = await Promise.all([
    listCorporateClientsWithReports(year),
    listCorporateManagers(),
  ])

  const filtered = clientsWithReports.filter(({ client }) => {
    if (manager !== 'all' && (client.manager?.trim() || '미배정') !== manager) return false
    if (query && !client.company_name.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const total = clientsWithReports.length
  const completed = clientsWithReports.filter((c) => c.report?.status === 'completed').length
  const unstarted = total - completed

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">법인세 보고서</h1>
        <p className="text-sm text-gray-500 mt-0.5">{year}년도 신고</p>
      </div>

      <Suspense fallback={<div className="h-12" />}>
        <CorporateTaxFilters
          currentYear={year}
          currentManager={manager}
          currentQuery={query}
          managers={managers}
        />
      </Suspense>

      <div className="flex gap-6 mb-6 text-sm bg-white border border-gray-200 rounded-lg px-5 py-3">
        <span>
          전체 법인고객 <strong className="text-indigo-600 ml-1">{total}</strong>
        </span>
        <span>
          보고서 완료 <strong className="text-green-600 ml-1">{completed}</strong>
        </span>
        <span>
          미작성 <strong className="text-orange-600 ml-1">{unstarted}</strong>
        </span>
      </div>

      <CorporateTaxReportList items={filtered} year={year} />
    </div>
  )
}
