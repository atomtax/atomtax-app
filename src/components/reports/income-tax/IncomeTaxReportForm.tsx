'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Save, Printer } from 'lucide-react'
import { saveIncomeTaxReportFull } from '@/app/actions/income-tax-reports'
import { IncomeStatementUpload } from '@/components/reports/IncomeStatementUpload'
import { IncomeStatementTable } from '@/components/reports/IncomeStatementTable'
import { HometaxPasteImport } from './HometaxPasteImport'
import { TaxCalculationTable } from './TaxCalculationTable'
import { TaxCreditsSection } from '@/components/reports/TaxCreditsSection'
import { TaxReductionsSection } from '@/components/reports/TaxReductionsSection'
import { IncomeTaxNotesSection } from './IncomeTaxNotesSection'
import { calculateIncomeTax } from '@/lib/calculators/income-tax'
import { migrateConclusionToSections } from '@/lib/utils/conclusion-sections'
import type { IncomeTaxReport, TaxCredit, TaxReduction, IncomeStatementSummary } from '@/types/database'
import type { ParsedIncomeTaxData } from '@/lib/calculators/income-tax-parser'

interface Props {
  client: {
    id: string
    company_name: string
    business_number: string | null
    representative: string | null
  }
  report: IncomeTaxReport
  year: number
}

function recalculate(d: IncomeTaxReport): IncomeTaxReport {
  // 종합소득세
  const tax_base = Math.max(0, d.income_total - d.income_deduction)
  const calc = calculateIncomeTax(tax_base)
  const calculated_tax = d.income_calculated_tax !== 0 ? d.income_calculated_tax : calc.tax
  const applied_rate = calc.rate
  const comprehensive_tax = Math.max(0, calculated_tax - d.income_tax_reduction - d.income_tax_credit)
  const determined_total = comprehensive_tax + d.income_separate_tax
  const total_tax = determined_total + d.income_penalty_tax + d.income_additional_tax
  const payable = total_tax - d.income_prepaid_tax
  const within_deadline = payable - d.income_stock_deduct + d.income_stock_add - d.income_installment
  const final_payable = within_deadline - d.income_refund_offset
  const local_tax = Math.floor(final_payable * 0.1)
  // 농어촌특별세: 사용자가 직접 입력. final_with_local 에 더해 단일 합계 표시
  const farm_special = Number(d.farm_special_tax) || 0
  const final_with_local = final_payable + local_tax + farm_special

  // 농어촌특별세
  const rural_tax_base = Math.max(0, d.rural_total - d.rural_deduction)
  const rural_comprehensive = Math.max(0, d.rural_calculated_tax - d.rural_tax_reduction - d.rural_tax_credit)
  const rural_determined = rural_comprehensive + d.rural_separate_tax
  const rural_total_tax = rural_determined + d.rural_penalty_tax + d.rural_additional_tax
  const rural_payable = rural_total_tax - d.rural_prepaid_tax
  const rural_within = rural_payable - d.rural_stock_deduct + d.rural_stock_add - d.rural_installment
  const rural_final = rural_within

  return {
    ...d,
    income_tax_base: tax_base,
    income_applied_rate: applied_rate,
    income_calculated_tax: calculated_tax,
    income_comprehensive_tax: comprehensive_tax,
    income_determined_total: determined_total,
    income_total_tax: total_tax,
    income_payable: payable,
    income_within_deadline: within_deadline,
    income_final_payable: final_payable,
    income_local_tax: local_tax,
    income_final_with_local: final_with_local,
    rural_tax_base,
    rural_comprehensive_tax: rural_comprehensive,
    rural_determined_total: rural_determined,
    rural_total_tax,
    rural_payable,
    rural_within_deadline: rural_within,
    rural_final_payable: rural_final,
  }
}

export function IncomeTaxReportForm({ client, report, year }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<IncomeTaxReport>(() => {
    // conclusion_sections 가 비어있으면 legacy conclusion_notes 로부터 변환
    const seeded =
      report.conclusion_sections && report.conclusion_sections.length > 0
        ? report
        : { ...report, conclusion_sections: migrateConclusionToSections(report.conclusion_notes) }
    return recalculate(seeded)
  })

  // 손익계산서
  const [filename, setFilename] = useState(report.income_statement_filename ?? '')
  const [periodLabel, setPeriodLabel] = useState(report.income_statement_period_label ?? '')
  const [summary, setSummary] = useState<IncomeStatementSummary | null>(
    report.income_statement_summary ?? null
  )

  function updateField<K extends keyof IncomeTaxReport>(key: K, value: IncomeTaxReport[K]) {
    setData((prev) => recalculate({ ...prev, [key]: value }))
  }

  function handleHometaxParsed(parsed: ParsedIncomeTaxData) {
    setData((prev) => recalculate({ ...prev, ...parsed }))
  }

  function handleStatementParsed(parsed: {
    filename: string
    period_label: string
    summary: IncomeStatementSummary
  }) {
    setFilename(parsed.filename)
    setPeriodLabel(parsed.period_label)
    setSummary(parsed.summary)
  }

  function handleYearChange(delta: number) {
    router.push(`/reports/income-tax/${client.id}?year=${year + delta}`)
  }

  async function performSave(): Promise<void> {
    const {
      id: _id,
      client_id: _cid,
      created_at: _ca,
      updated_at: _ua,
      completed_at: _comp,
      ...saveData
    } = data
    await saveIncomeTaxReportFull(report.id, {
      ...saveData,
      income_statement_filename: filename || null,
      income_statement_period_label: periodLabel || null,
      income_statement_summary: summary,
    })
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await performSave()
        alert('저장되었습니다.')
        router.refresh()
      } catch (e) {
        alert(`저장 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  function handlePdfOutput() {
    // 팝업 차단 회피: 사용자 클릭 컨텍스트 안에서 새 탭 먼저 열고, 저장 후 URL 설정
    const newWindow = window.open('about:blank', '_blank')
    if (!newWindow) {
      alert(
        '새 탭이 차단되었습니다. 브라우저 팝업 차단을 해제하고 다시 시도해 주세요.',
      )
      return
    }
    startTransition(async () => {
      try {
        await performSave()
        newWindow.location.href = `/reports/income-tax/${client.id}/print?year=${year}`
      } catch (e) {
        newWindow.close()
        alert(
          `저장 실패: ${e instanceof Error ? e.message : String(e)}\nPDF 출력을 위해 먼저 데이터가 저장되어야 합니다.`,
        )
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* 고객 정보 + 연도 헤더 */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-1">{client.company_name}</h2>
        {client.representative && (
          <p className="text-sm text-gray-500">대표자: {client.representative}</p>
        )}
        {client.business_number && (
          <p className="text-sm text-gray-500">{client.business_number}</p>
        )}

        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm font-medium text-gray-700">신고연도</span>
          <button
            onClick={() => handleYearChange(-1)}
            className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-2xl font-bold text-blue-600 min-w-[80px] text-center">{year}</span>
          <button
            onClick={() => handleYearChange(1)}
            className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* 손익계산서 업로드 */}
      <IncomeStatementUpload
        currentFilename={filename}
        onParsed={handleStatementParsed}
      />

      {/* 손익계산서 표 (업로드 후 표시) — 개인사업자는 법인세 차감전/법인세 비용 제외 */}
      {summary && (
        <IncomeStatementTable
          periodLabel={periodLabel}
          summary={summary}
          hideCorporateTaxRows
        />
      )}

      {/* 홈택스 텍스트 붙여넣기 */}
      <HometaxPasteImport onParsed={handleHometaxParsed} />

      {/* 세액 계산 표 */}
      <TaxCalculationTable data={data} onChange={updateField} />

      {/* 세액공제 */}
      <TaxCreditsSection
        credits={data.tax_credits}
        onChange={(credits: TaxCredit[]) => updateField('tax_credits', credits)}
      />

      {/* 세액감면 */}
      <TaxReductionsSection
        reductions={data.tax_reductions}
        onChange={(reductions: TaxReduction[]) => updateField('tax_reductions', reductions)}
      />

      {/* 메모 + 결론 섹션 */}
      <IncomeTaxNotesSection
        data={data}
        summary={summary}
        isSincerefiling={data.is_sincere_filing}
        additionalNotes={data.additional_notes ?? ''}
        conclusionSections={data.conclusion_sections}
        onSincereChange={(v) => updateField('is_sincere_filing', v)}
        onAdditionalChange={(v) => updateField('additional_notes', v)}
        onConclusionSectionsChange={(sections) =>
          updateField('conclusion_sections', sections)
        }
      />

      {/* 저장/출력 버튼 */}
      <div className="flex justify-end gap-2 pt-2 pb-6">
        <button
          onClick={() => router.push(`/reports/income-tax?year=${year}`)}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
        >
          돌아가기
        </button>
        <button
          onClick={handlePdfOutput}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 bg-white rounded hover:bg-gray-50 text-sm disabled:opacity-50"
        >
          <Printer size={16} />
          {isPending ? '저장 중...' : 'PDF 출력'}
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          <Save size={16} />
          {isPending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
