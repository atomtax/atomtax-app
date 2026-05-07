import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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
    .select('id, company_name, business_type_category')
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

  return (
    <div className="p-6">
      <Link
        href="/reports/corporate-tax"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft size={16} /> 목록으로
      </Link>

      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{client.company_name}</h1>
        <p className="text-gray-500 mb-8">신고연도: {year}년</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-900 font-semibold text-lg mb-2">법인세 보고서 작성 페이지</p>
          <p className="text-sm text-blue-700">v17b에서 손익계산서 업로드 + 작성 폼 추가 예정</p>
        </div>
      </div>
    </div>
  )
}
