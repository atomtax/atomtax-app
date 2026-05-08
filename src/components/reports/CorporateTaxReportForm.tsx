'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Save, Printer } from 'lucide-react'
import { saveCorporateTaxReportFull } from '@/app/actions/corporate-tax-reports'
import {
  calculateCorporateTax,
  calculateLocalTax,
  calculateRuralTax,
} from '@/lib/calculators/corporate-tax'
import { IncomeStatementUpload } from './IncomeStatementUpload'
import { FinancialSummary } from './FinancialSummary'
import { IncomeStatementTable } from './IncomeStatementTable'
import { TaxCalculationSection } from './TaxCalculationSection'
import { TaxCreditsSection } from './TaxCreditsSection'
import { TaxReductionsSection } from './TaxReductionsSection'
import { NotesSection } from './NotesSection'
import type { CorporateTaxReport, IncomeStatementSummary, TaxCredit, TaxReduction } from '@/types/database'

interface Props {
  client: { id: string; company_name: string; business_number: string | null }
  report: CorporateTaxReport
  year: number
}

export function CorporateTaxReportForm({ client, report, year }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 기본 필드
  const [filename, setFilename] = useState(report.income_statement_filename ?? '')
  const [periodLabel, setPeriodLabel] = useState(report.income_statement_period_label ?? '')
  const [summary, setSummary] = useState<IncomeStatementSummary | null>(
    report.income_statement_summary
  )
  const [revenue, setRevenue] = useState<number | null>(report.revenue)
  const [netIncome, setNetIncome] = useState<number | null>(report.net_income)

  // 세금 계산 필드
  const [carryoverLoss, setCarryoverLoss] = useState(report.carryover_loss)
  const [prepaidTax, setPrepaidTax] = useState(report.prepaid_tax)
  const [taxCredits, setTaxCredits] = useState<TaxCredit[]>(report.tax_credits)
  const [taxReductions, setTaxReductions] = useState<TaxReduction[]>(report.tax_reductions)

  // 메모
  const [isSincerefiling, setIsSincerefiling] = useState(report.is_sincere_filing)
  const [additionalNotes, setAdditionalNotes] = useState(report.additional_notes ?? '')
  const [conclusionNotes, setConclusionNotes] = useState(report.conclusion_notes ?? '')

  // 파생 계산값 (실시간)
  const taxableIncome = useMemo(
    () => Math.max(0, (netIncome ?? 0) - carryoverLoss),
    [netIncome, carryoverLoss]
  )
  const calculatedTax = useMemo(
    () => calculateCorporateTax(taxableIncome, year),
    [taxableIncome, year]
  )
  const totalCredits = useMemo(
    () => taxCredits.reduce((s, c) => s + c.current_amount + c.carryover_amount, 0),
    [taxCredits]
  )
  const totalReductions = useMemo(
    () => taxReductions.reduce((s, r) => s + r.current_amount, 0),
    [taxReductions]
  )
  const determinedTax = useMemo(
    () => Math.max(0, calculatedTax - totalCredits - totalReductions),
    [calculatedTax, totalCredits, totalReductions]
  )
  const localTax = useMemo(() => calculateLocalTax(determinedTax), [determinedTax])
  const ruralSpecialTax = useMemo(() => calculateRuralTax(totalReductions), [totalReductions])
  const finalTax = useMemo(
    () => determinedTax + localTax + ruralSpecialTax - prepaidTax,
    [determinedTax, localTax, ruralSpecialTax, prepaidTax]
  )

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
        await saveCorporateTaxReportFull({
          reportId: report.id,
          income_statement_filename: filename || null,
          income_statement_period_label: periodLabel || null,
          income_statement_summary: summary,
          revenue,
          net_income: netIncome,
          carryover_loss: carryoverLoss,
          current_loss: report.current_loss,
          calculated_tax: calculatedTax,
          determined_tax: determinedTax,
          local_tax: localTax,
          rural_special_tax: ruralSpecialTax,
          prepaid_tax: prepaidTax,
          final_tax: finalTax,
          tax_credits: taxCredits,
          tax_reductions: taxReductions,
          is_sincere_filing: isSincerefiling,
          additional_notes: additionalNotes || null,
          conclusion_notes: conclusionNotes || null,
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

      {/* 세금 계산 */}
      <TaxCalculationSection
        netIncome={netIncome}
        carryoverLoss={carryoverLoss}
        taxableIncome={taxableIncome}
        calculatedTax={calculatedTax}
        totalCredits={totalCredits}
        totalReductions={totalReductions}
        determinedTax={determinedTax}
        localTax={localTax}
        ruralSpecialTax={ruralSpecialTax}
        prepaidTax={prepaidTax}
        finalTax={finalTax}
        year={year}
        onCarryoverLossChange={setCarryoverLoss}
        onPrepaidTaxChange={setPrepaidTax}
      />

      {/* 세액공제 */}
      <TaxCreditsSection credits={taxCredits} onChange={setTaxCredits} />

      {/* 세액감면 */}
      <TaxReductionsSection reductions={taxReductions} onChange={setTaxReductions} />

      {/* 메모 */}
      <NotesSection
        isSincerefiling={isSincerefiling}
        additionalNotes={additionalNotes}
        conclusionNotes={conclusionNotes}
        onSincereChange={setIsSincerefiling}
        onAdditionalChange={setAdditionalNotes}
        onConclusionChange={setConclusionNotes}
      />

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
          onClick={() =>
            router.push(`/reports/corporate-tax/${client.id}/print?year=${year}`)
          }
          className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <Printer size={15} />
          인쇄
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
