import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReportByToken } from '@/lib/db/share-links'
import { IncomeTaxCoverPage } from '@/components/reports/income-tax/print/IncomeTaxCoverPage'
import { IncomeTaxSummaryPage } from '@/components/reports/income-tax/print/IncomeTaxSummaryPage'
import { IncomeStatementPage } from '@/components/reports/income-tax/print/IncomeStatementPage'
import { IncomeTaxCreditsPage } from '@/components/reports/income-tax/print/IncomeTaxCreditsPage'
import { IncomeTaxConclusionPage } from '@/components/reports/income-tax/print/IncomeTaxConclusionPage'
import { IncomeTaxDownloadPDFButton } from '@/components/reports/income-tax/print/IncomeTaxDownloadPDFButton'
import type { IncomeTaxReport } from '@/types/database'

export const metadata = {
  title: '보고서 공유',
  robots: 'noindex, nofollow',
}

interface Props {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const link = await getReportByToken(token)
  if (!link) notFound()

  if (link.reportType === 'income_tax') {
    return <IncomeTaxShareView reportId={link.reportId} clientId={link.clientId} />
  }

  // 향후 corporate_tax / vat
  notFound()
}

async function IncomeTaxShareView({
  reportId,
  clientId,
}: {
  reportId: string
  clientId: string
}) {
  // 보고서/고객 본체 fetch 는 service role 사용 (clients / income_tax_reports 의 RLS 우회).
  // 보안은 getReportByToken 의 토큰 유효성 검증에 의존 — 토큰 없거나 만료면 위에서 notFound.
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
    .eq('id', reportId)
    .single()
  if (!reportRaw) notFound()

  const report = reportRaw as IncomeTaxReport
  const year = report.report_year

  const hasCreditsOrReductions =
    (report.tax_credits?.length ?? 0) > 0 ||
    (report.tax_reductions?.length ?? 0) > 0
  const totalPages = hasCreditsOrReductions ? 5 : 4
  const conclusionChapter = hasCreditsOrReductions ? '05' : '04'
  const conclusionPage = hasCreditsOrReductions ? 5 : 4

  return (
    <>
      <div
        className="no-print"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 50,
        }}
      >
        <IncomeTaxDownloadPDFButton companyName={client.company_name} reportYear={year} />
      </div>

      <IncomeTaxCoverPage
        client={{
          company_name: client.company_name,
          representative: client.representative,
          business_number: client.business_number,
        }}
        reportYear={year}
      />
      <IncomeTaxSummaryPage
        reportYear={year}
        report={report}
        chapterNumber="02"
        pageNumber={2}
        totalPages={totalPages}
      />
      <IncomeStatementPage
        reportYear={year}
        summary={report.income_statement_summary}
        periodLabel={report.income_statement_period_label ?? null}
        chapterNumber="03"
        pageNumber={3}
        totalPages={totalPages}
      />
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
      <IncomeTaxConclusionPage
        reportYear={year}
        report={report}
        chapterNumber={conclusionChapter}
        pageNumber={conclusionPage}
        totalPages={totalPages}
      />
    </>
  )
}

