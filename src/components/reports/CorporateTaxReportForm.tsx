'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { saveCorporateTaxReportBasic } from '@/app/actions/corporate-tax-reports'
import { IncomeStatementUpload } from './IncomeStatementUpload'
import { FinancialSummary } from './FinancialSummary'
import { IncomeStatementTable } from './IncomeStatementTable'
import type { CorporateTaxReport, IncomeStatementSummary } from '@/types/database'

interface Props {
  client: { id: string; company_name: string; business_number: string | null }
  report: CorporateTaxReport
  year: number
}

export function CorporateTaxReportForm({ client, report, year }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [filename, setFilename] = useState(report.income_statement_filename ?? '')
  const [periodLabel, setPeriodLabel] = useState(report.income_statement_period_label ?? '')
  const [summary, setSummary] = useState<IncomeStatementSummary | null>(
    report.income_statement_summary
  )
  const [revenue, setRevenue] = useState<number | null>(report.revenue)
  const [netIncome, setNetIncome] = useState<number | null>(report.net_income)

  function handleParsed(data: {
    filename: string
    period_label: string
    summary: IncomeStatementSummary
  }) {
    setFilename(data.filename)
    setPeriodLabel(data.period_label)
    setSummary(data.summary)
    setRevenue(data.summary.revenue)
    setNetIncome(data.summary.net_income)
  }

  function handleYearChange(delta: number) {
    router.push(`/reports/corporate-tax/${client.id}?year=${year + delta}`)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveCorporateTaxReportBasic({
          reportId: report.id,
          income_statement_filename: filename || null,
          income_statement_period_label: periodLabel || null,
          income_statement_summary: summary,
          revenue,
          net_income: netIncome,
        })
        alert('저장되었습니다.')
        router.refresh()
      } catch (e) {
        alert(`저장 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  const isSincereThreshold = (revenue ?? 0) >= 150_000_000_000

  return (
    <div className="space-y-6">
      {/* 회사명 + 신고연도 */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-0.5">{client.company_name}</h2>
        {client.business_number && (
          <p className="text-sm text-gray-500">{client.business_number}</p>
        )}

        <div className="flex items-center gap-3 mt-5">
          <span className="text-sm font-medium text-gray-700">신고연도</span>
          <button
            type="button"
            onClick={() => handleYearChange(-1)}
            className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-2xl font-bold text-blue-600 min-w-[80px] text-center tabular-nums">
            {year}
          </span>
          <button
            type="button"
            onClick={() => handleYearChange(1)}
            className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* 성실신고 안내 */}
      {isSincereThreshold && (
        <section className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
          <p className="font-semibold text-orange-900 mb-1">📢 성실신고 확인 대상 안내</p>
          <p className="text-sm text-orange-800">
            당기 매출액이 <strong>1,500억원 이상</strong>이거나, 직전 사업연도 자산 가액이{' '}
            <strong>500억원 이상</strong>인 기업은 성실신고 확인 대상입니다.
          </p>
        </section>
      )}

      {/* 손익계산서 업로드 */}
      <IncomeStatementUpload currentFilename={filename} onParsed={handleParsed} />

      {/* 재무 현황 */}
      <FinancialSummary
        revenue={revenue}
        netIncome={netIncome}
        onRevenueChange={setRevenue}
        onNetIncomeChange={setNetIncome}
      />

      {/* 손익계산서 요약 테이블 */}
      {summary && <IncomeStatementTable periodLabel={periodLabel} summary={summary} />}

      {/* v17c placeholder */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-400">
        세금 계산 / 세액공제 / 세액감면 / 메모 — v17c에서 추가 예정
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.push(`/reports/corporate-tax?year=${year}`)}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          돌아가기
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={15} />
          {isPending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
