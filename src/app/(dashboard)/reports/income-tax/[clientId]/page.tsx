import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ensureIncomeTaxReport } from '@/app/actions/income-tax-reports'
import { IncomeTaxReportForm } from '@/components/reports/income-tax/IncomeTaxReportForm'
import type { IncomeTaxReport } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ year?: string }>
}

export default async function IncomeTaxReportEditPage({ params, searchParams }: Props) {
  const { clientId } = await params
  const sp = await searchParams
  const year = Number(sp.year) || new Date().getFullYear() - 1

  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name, business_number, representative, business_type_category')
    .eq('id', clientId)
    .single()

  if (!client) {
    return <div className="p-6 text-gray-500">고객을 찾을 수 없습니다.</div>
  }

  if (client.business_type_category !== '개인') {
    return (
      <div className="p-6 space-y-3">
        <p className="text-gray-700">개인 사업자만 종합소득세 보고서를 작성할 수 있습니다.</p>
        <Link href="/reports/income-tax" className="text-indigo-600 hover:underline text-sm">
          ← 목록으로
        </Link>
      </div>
    )
  }

  const { id: reportId } = await ensureIncomeTaxReport(clientId, year)

  const { data: reportRaw } = await supabase
    .from('income_tax_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (!reportRaw) redirect('/reports/income-tax')

  const report = reportRaw as IncomeTaxReport

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href={`/reports/income-tax?year=${year}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4"
      >
        <ArrowLeft size={16} /> 목록으로
      </Link>

      <h1 className="text-2xl font-bold mb-6">종합소득세 보고서 작성</h1>

      <IncomeTaxReportForm
        key={reportId}
        client={{
          id: client.id,
          company_name: client.company_name,
          business_number: client.business_number,
          representative: client.representative,
        }}
        report={report}
        year={year}
      />
    </div>
  )
}
