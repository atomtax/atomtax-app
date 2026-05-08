import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PrintButton from '@/components/print/PrintButton'
import { CoverPage } from '@/components/reports/print/CoverPage'
import { FinancialPage } from '@/components/reports/print/FinancialPage'
import { TaxPaymentPage } from '@/components/reports/print/TaxPaymentPage'
import { TaxCreditsPage } from '@/components/reports/print/TaxCreditsPage'
import { IncomeStatementPage } from '@/components/reports/print/IncomeStatementPage'
import { ConclusionPage } from '@/components/reports/print/ConclusionPage'
import type { CorporateTaxReport } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ year?: string }>
}

export default async function CorporateTaxPrintPage({ params, searchParams }: Props) {
  const { clientId } = await params
  const sp = await searchParams
  const year = Number(sp.year) || new Date().getFullYear() - 1

  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name, business_number, business_type, representative, manager')
    .eq('id', clientId)
    .single()

  if (!client) notFound()

  const { data: reportRaw } = await supabase
    .from('corporate_tax_reports')
    .select('*')
    .eq('client_id', clientId)
    .eq('report_year', year)
    .single()

  if (!reportRaw) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#64748b', marginBottom: '16px' }}>저장된 보고서가 없습니다. 먼저 저장해주세요.</p>
        <Link
          href={`/reports/corporate-tax/${clientId}?year=${year}`}
          style={{ color: '#4f46e5', textDecoration: 'underline', fontSize: '14px' }}
        >
          ← 작성 페이지로
        </Link>
      </div>
    )
  }

  const report = reportRaw as CorporateTaxReport
  const totalCredits = report.tax_credits.reduce((s, c) => s + (c.current_amount ?? 0) + (c.carryover_amount ?? 0), 0)
  const totalReductions = report.tax_reductions.reduce((s, r) => s + (r.current_amount ?? 0), 0)

  return (
    <>
      <div className="no-print" style={{
        position: 'fixed', top: '16px', right: '16px', zIndex: 50,
        display: 'flex', gap: '8px',
      }}>
        <PrintButton label="PDF 다운로드 / 인쇄" />
        <Link
          href={`/reports/corporate-tax/${clientId}?year=${year}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', fontSize: '14px', fontWeight: 500,
            color: '#475569', background: 'white',
            border: '1px solid #cbd5e1', borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            textDecoration: 'none',
          }}
        >
          ← 작성 페이지로
        </Link>
      </div>

      <CoverPage
        client={{
          company_name: client.company_name,
          business_type: client.business_type ?? undefined,
          business_number: client.business_number,
        }}
        reportYear={year}
      />

      <FinancialPage
        reportYear={year}
        summary={report.income_statement_summary}
        finalTax={report.final_tax}
      />

      <TaxPaymentPage
        reportYear={year}
        calculatedTax={report.calculated_tax}
        determinedTax={report.determined_tax}
        localTax={report.local_tax}
        ruralSpecialTax={report.rural_special_tax}
        prepaidTax={report.prepaid_tax}
        finalTax={report.final_tax}
        pretaxIncome={report.income_statement_summary?.pretax_income ?? null}
      />

      <TaxCreditsPage
        reportYear={year}
        taxCredits={report.tax_credits}
      />

      <IncomeStatementPage
        reportYear={year}
        summary={report.income_statement_summary}
        periodLabel={report.income_statement_period_label}
      />

      <ConclusionPage
        reportYear={year}
        summary={report.income_statement_summary}
        finalTax={report.final_tax}
        determinedTax={report.determined_tax}
        totalCredits={totalCredits}
        totalReductions={totalReductions}
        conclusionNotes={report.conclusion_notes}
        additionalNotes={report.additional_notes}
        isSincerefiling={report.is_sincere_filing}
      />
    </>
  )
}
