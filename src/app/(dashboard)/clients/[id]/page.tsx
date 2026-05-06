import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getClientById } from '@/lib/db/clients'
import { getCorporateTaxReportsByClient } from '@/lib/db/reports'
import { getAdjustmentInvoiceById } from '@/lib/db/adjustment-invoices'
import { formatDate, formatCurrency, formatBusinessNumber } from '@/lib/utils/format'
import ClientDetailClient from './ClientDetailClient'
import type { AdjustmentInvoice, CorporateTaxReport } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

async function getClientInvoices(clientId: string): Promise<AdjustmentInvoice[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('adjustment_invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('year', { ascending: false })
  return (data ?? []) as AdjustmentInvoice[]
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const [client, taxReports, invoices] = await Promise.all([
    getClientById(id),
    getCorporateTaxReportsByClient(id),
    getClientInvoices(id),
  ])

  if (!client) notFound()

  const fields = [
    { label: '고객번호', value: client.number },
    { label: '상호명', value: client.company_name },
    { label: '구분', value: client.business_type_category },
    { label: '사업자번호', value: formatBusinessNumber(client.business_number) },
    { label: '법인번호', value: client.corporate_number },
    { label: '대표자', value: client.representative },
    { label: '담당자', value: client.manager },
    { label: '전화번호', value: client.phone },
    { label: '업태', value: client.business_type },
    { label: '종목', value: client.business_item },
    { label: '계약 시작일', value: formatDate(client.start_date) },
    { label: '계약 종료일', value: formatDate(client.end_date) },
    { label: '계약금액', value: formatCurrency(client.contract_amount) },
    { label: '공급가액', value: formatCurrency(client.supply_amount) },
    { label: '세액', value: formatCurrency(client.tax_amount) },
    { label: '주소', value: client.address },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{client.company_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">고객 상세 정보</p>
        </div>
        <ClientDetailClient client={client} />
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Pencil size={14} className="text-indigo-600" />
          기본 정보
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs text-gray-500 mb-0.5">{f.label}</p>
              <p className="text-sm text-gray-900">{f.value || '-'}</p>
            </div>
          ))}
        </div>
        {client.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">메모</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </div>

      {/* 법인세 보고서 */}
      {taxReports.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">법인세 보고서</h2>
          <div className="space-y-2">
            {taxReports.map((report: CorporateTaxReport) => (
              <div
                key={report.id}
                className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-sm"
              >
                <span className="font-medium text-gray-900">{report.year}년</span>
                <div className="flex gap-6 text-gray-500">
                  <span>매출 {formatCurrency(report.revenue)}</span>
                  <span>결정세액 {formatCurrency(report.determined_tax)}</span>
                </div>
                <Link
                  href={`/reports/corporate-tax?clientId=${client.id}&year=${report.year}`}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  보기
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 조정료 청구서 */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">조정료 청구서</h2>
          <div className="space-y-2">
            {invoices.map((invoice: AdjustmentInvoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg text-sm"
              >
                <span className="font-medium text-gray-900">{invoice.year ?? '-'}년</span>
                <div className="flex gap-6 text-gray-500">
                  <span>매출 {formatCurrency(invoice.revenue)}</span>
                  <span>청구금액 {formatCurrency(invoice.total_amount || invoice.final_fee)}</span>
                </div>
                <Link
                  href={`/invoices/adjustment/${invoice.id}/print`}
                  className="text-xs text-indigo-600 hover:underline"
                  target="_blank"
                >
                  인쇄
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
