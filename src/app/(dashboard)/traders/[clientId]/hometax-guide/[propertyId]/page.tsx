import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '홈택스 입력 참고 — 토지등 매매차익 예정신고',
}

interface Props {
  params: Promise<{ clientId: string; propertyId: string }>
}

export default async function HometaxGuidePage({ params }: Props) {
  const { clientId, propertyId } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: property }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, company_name, business_number')
      .eq('id', clientId)
      .single(),
    supabase
      .from('trader_properties')
      .select('*')
      .eq('id', propertyId)
      .eq('client_id', clientId)
      .single(),
  ])

  if (!client || !property) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href={`/traders/${clientId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={14} /> 매매사업자로 돌아가기
        </Link>
        <p className="mt-6 text-gray-600">물건을 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (property.tax_category === '양도소득세') {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href={`/traders/${clientId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={14} /> 매매사업자로 돌아가기
        </Link>
        <p className="mt-6 text-amber-700 bg-amber-50 border border-amber-200 rounded px-4 py-3">
          양도소득세 건은 토지등 매매차익 예정신고 대상이 아닙니다. 본
          참고화면은 매매사업자 건에만 제공됩니다.
        </p>
      </div>
    )
  }

  // Phase 6 Commit 2/3에서 본문 채울 예정
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href={`/traders/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4"
      >
        <ArrowLeft size={14} /> 매매사업자로 돌아가기
      </Link>
      <h1 className="text-xl font-bold text-gray-900">
        홈택스 입력 참고 — 토지등 매매차익 예정신고
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        {client.company_name} · {property.property_name}
      </p>
      <p className="mt-8 text-gray-500 text-sm">
        본문은 Commit 2에서 채워집니다.
      </p>
    </div>
  )
}
