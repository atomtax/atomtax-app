import { notFound } from 'next/navigation'
import { getAdjustmentInvoiceById } from '@/lib/db/adjustment-invoices'
import AdjustmentInvoicePrint from '@/components/invoices/AdjustmentInvoicePrint'
import AdjustmentInvoiceFeeSchedule from '@/components/invoices/AdjustmentInvoiceFeeSchedule'
import PrintButton from '@/components/print/PrintButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdjustmentInvoicePrintPage({ params }: Props) {
  const { id } = await params

  const invoice = await getAdjustmentInvoiceById(id)
  if (!invoice) notFound()

  return (
    <>
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <PrintButton label="PDF 다운로드 / 인쇄" />
        <a
          href="/invoices/adjustment"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          ← 목록으로
        </a>
      </div>
      <AdjustmentInvoicePrint invoice={invoice} />
      <AdjustmentInvoiceFeeSchedule />
    </>
  )
}
