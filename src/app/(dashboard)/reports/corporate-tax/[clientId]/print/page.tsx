import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PrintButton from '@/components/print/PrintButton'
import { CorporateTaxPrint } from '@/components/reports/CorporateTaxPrint'
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
    .select('id, company_name, business_number, representative, manager')
    .eq('id', clientId)
    .single()

  if (!client) notFound()

  const { data: report } = await supabase
    .from('corporate_tax_reports')
    .select('*')
    .eq('client_id', clientId)
    .eq('report_year', year)
    .single()

  if (!report) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">저장된 보고서가 없습니다. 먼저 저장해주세요.</p>
        <Link
          href={`/reports/corporate-tax/${clientId}?year=${year}`}
          className="text-indigo-600 hover:underline text-sm"
        >
          ← 작성 페이지로
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <PrintButton label="PDF 다운로드 / 인쇄" />
        <Link
          href={`/reports/corporate-tax/${clientId}?year=${year}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          ← 작성 페이지로
        </Link>
      </div>
      <CorporateTaxPrint
        client={client}
        report={report as CorporateTaxReport}
        year={year}
      />
    </>
  )
}
