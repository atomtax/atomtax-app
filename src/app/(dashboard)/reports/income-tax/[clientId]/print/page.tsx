import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IncomeTaxCoverPage } from '@/components/reports/income-tax/print/IncomeTaxCoverPage'
import { IncomeTaxSummaryPage } from '@/components/reports/income-tax/print/IncomeTaxSummaryPage'
import { IncomeStatementPage } from '@/components/reports/income-tax/print/IncomeStatementPage'
import { IncomeTaxCreditsPage } from '@/components/reports/income-tax/print/IncomeTaxCreditsPage'
import { IncomeTaxConclusionPage } from '@/components/reports/income-tax/print/IncomeTaxConclusionPage'
import { IncomeTaxDownloadPDFButton } from '@/components/reports/income-tax/print/IncomeTaxDownloadPDFButton'
import {
  ShareCustomerMessageBox,
  ShareLinkTopButton,
} from '@/components/reports/income-tax/ShareLinkActions'
import type { IncomeTaxReport } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ year?: string }>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { clientId } = await params
  const sp = await searchParams
  const year = Number(sp.year) || new Date().getFullYear() - 1
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('company_name')
    .eq('id', clientId)
    .single()
  return {
    title: client
      ? `${client.company_name} - ${year}년 종합소득세 보고서`
      : '종합소득세 보고서',
  }
}

export default async function IncomeTaxPrintPage({ params, searchParams }: Props) {
  const { clientId } = await params
  const sp = await searchParams
  const year = Number(sp.year) || new Date().getFullYear() - 1

  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name, business_number, representative')
    .eq('id', clientId)
    .single()

  if (!client) notFound()

  const { data: reportRaw } = await supabase
    .from('income_tax_reports')
    .select('*')
    .eq('client_id', clientId)
    .eq('report_year', year)
    .single()

  if (!reportRaw) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#64748b', marginBottom: '16px' }}>저장된 보고서가 없습니다. 먼저 저장해주세요.</p>
        <Link
          href={`/reports/income-tax/${clientId}?year=${year}`}
          style={{ color: '#4f46e5', textDecoration: 'underline', fontSize: '14px' }}
        >
          ← 작성 페이지로
        </Link>
      </div>
    )
  }

  const report = reportRaw as IncomeTaxReport

  // 세액공제/감면 추가 항목이 있을 때만 CHAPTER 04 표시.
  // 표시 여부에 따라 후속 챕터 번호 자동 재정렬 (Conclusion 04 또는 05).
  const hasCreditsOrReductions =
    (report.tax_credits?.length ?? 0) > 0 ||
    (report.tax_reductions?.length ?? 0) > 0
  const totalPages = hasCreditsOrReductions ? 5 : 4
  const conclusionChapter = hasCreditsOrReductions ? '05' : '04'
  const conclusionPage = hasCreditsOrReductions ? 5 : 4

  return (
    <>
      <div className="no-print" style={{
        position: 'fixed', top: '16px', right: '16px', zIndex: 50,
        display: 'flex', gap: '8px',
      }}>
        <Link
          href={`/reports/income-tax/${clientId}?year=${year}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', fontSize: '13px', fontWeight: 500,
            color: '#475569', background: 'white',
            border: '1px solid #cbd5e1', borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            textDecoration: 'none',
          }}
        >
          ← 작성 페이지로
        </Link>
        <ShareLinkTopButton
          reportType="income_tax"
          reportId={report.id}
          clientId={client.id}
        />
        <IncomeTaxDownloadPDFButton companyName={client.company_name} reportYear={year} />
      </div>

      {/* 01 표지 */}
      <IncomeTaxCoverPage
        client={{
          company_name: client.company_name,
          representative: client.representative,
          business_number: client.business_number,
        }}
        reportYear={year}
      />

      {/* 02 신고개요 */}
      <IncomeTaxSummaryPage
        reportYear={year}
        report={report}
        chapterNumber="02"
        pageNumber={2}
        totalPages={totalPages}
      />

      {/* 03 손익계산서 */}
      <IncomeStatementPage
        reportYear={year}
        summary={report.income_statement_summary}
        periodLabel={report.income_statement_period_label ?? null}
        chapterNumber="03"
        pageNumber={3}
        totalPages={totalPages}
      />

      {/* 04 세액공제·감면 — 항목 있을 때만 */}
      {hasCreditsOrReductions && (
        <IncomeTaxCreditsPage
          reportYear={year}
          taxCredits={report.tax_credits}
          taxReductions={report.tax_reductions}
          chapterNumber="04"
          pageNumber={4}
          totalPages={totalPages}
        />
      )}

      {/* 05 (또는 04) 종합결론 */}
      <IncomeTaxConclusionPage
        reportYear={year}
        report={report}
        chapterNumber={conclusionChapter}
        pageNumber={conclusionPage}
        totalPages={totalPages}
      />

      {/* 고객 전달용 메시지 박스 (no-print, PDF 에 포함되지 않음) */}
      <ShareCustomerMessageBox
        reportType="income_tax"
        reportId={report.id}
        clientId={client.id}
        companyName={client.company_name}
      />
    </>
  )
}
