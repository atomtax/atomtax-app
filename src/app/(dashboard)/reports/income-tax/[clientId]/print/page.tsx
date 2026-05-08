import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IncomeTaxCoverPage } from '@/components/reports/income-tax/print/IncomeTaxCoverPage'
import { IncomeTaxOverviewPage } from '@/components/reports/income-tax/print/IncomeTaxOverviewPage'
import { IncomeTaxCalcPage } from '@/components/reports/income-tax/print/IncomeTaxCalcPage'
import { IncomeTaxCreditsPage } from '@/components/reports/income-tax/print/IncomeTaxCreditsPage'
import { IncomeTaxConclusionPage } from '@/components/reports/income-tax/print/IncomeTaxConclusionPage'
import { IncomeTaxDownloadPDFButton } from '@/components/reports/income-tax/print/IncomeTaxDownloadPDFButton'
import type { IncomeTaxReport } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ year?: string }>
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

      <IncomeTaxOverviewPage reportYear={year} report={report} />

      <IncomeTaxCalcPage reportYear={year} report={report} />

      <IncomeTaxCreditsPage
        reportYear={year}
        taxCredits={report.tax_credits}
        taxReductions={report.tax_reductions}
      />

      <IncomeTaxConclusionPage reportYear={year} report={report} />
    </>
  )
}
