import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ensureCorporateTaxReport } from '@/app/actions/corporate-tax-reports'
import { CorporateTaxReportForm } from '@/components/reports/CorporateTaxReportForm'
import type { CorporateTaxReport } from '@/types/database'

interface Props {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ year?: string }>
}

export default async function CorporateTaxReportEditPage({ params, searchParams }: Props) {
  const { clientId } = await params
  const sp = await searchParams
  const year = Number(sp.year) || new Date().getFullYear() - 1

  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name, business_number, business_type_category')
    .eq('id', clientId)
    .single()

  if (!client) {
    return (
      <div className="p-6">
        <Link href="/reports/corporate-tax" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
          <ArrowLeft size={16} /> 목록으로
        </Link>
        <p className="text-gray-500">고객을 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (client.business_type_category !== '법인') {
    return (
      <div className="p-6">
        <Link href="/reports/corporate-tax" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
          <ArrowLeft size={16} /> 목록으로
        </Link>
        <p className="text-gray-500">법인 고객만 법인세 보고서를 작성할 수 있습니다.</p>
      </div>
    )
  }

  let reportId: string
  try {
    const result = await ensureCorporateTaxReport(clientId, year)
    reportId = result.id
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return (
      <div className="p-6">
        <Link href="/reports/corporate-tax" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
          <ArrowLeft size={16} /> 목록으로
        </Link>
        <p className="text-red-600">보고서 초기화 실패: {msg}</p>
      </div>
    )
  }

  const { data: report, error: reportError } = await supabase
    .from('corporate_tax_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (reportError || !report) {
    return (
      <div className="p-6">
        <Link href="/reports/corporate-tax" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
          <ArrowLeft size={16} /> 목록으로
        </Link>
        <p className="text-red-600">보고서를 불러올 수 없습니다{reportError ? `: ${reportError.message}` : ''}.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href={`/reports/corporate-tax?year=${year}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft size={16} /> 목록으로
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">법인세 보고서 작성</h1>

      <CorporateTaxReportForm
        key={reportId}
        client={client}
        report={report as CorporateTaxReport}
        year={year}
      />
    </div>
  )
}
