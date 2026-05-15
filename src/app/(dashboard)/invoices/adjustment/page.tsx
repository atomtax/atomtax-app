import type { Metadata } from 'next'
import { listClients } from '@/lib/db/clients'
import { listAdjustmentInvoices } from '@/lib/db/adjustment-invoices'
import AdjustmentInvoiceManager from '@/components/invoices/AdjustmentInvoiceManager'

export const metadata: Metadata = {
  title: '조정료 청구서',
}

export default async function AdjustmentInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; type?: string }>
}) {
  const params = await searchParams
  const year = params.year ? parseInt(params.year) : new Date().getFullYear() - 1
  const businessType = (params.type === 'individual' ? 'individual' : 'corporate') as
    | 'corporate'
    | 'individual'

  const [clients, invoices] = await Promise.all([
    listClients({ businessTypeCategory: businessType === 'corporate' ? '법인' : '개인' }),
    listAdjustmentInvoices({ year, businessType }),
  ])

  return (
    <AdjustmentInvoiceManager
      key={`${year}-${businessType}`}
      initialClients={clients}
      initialInvoices={invoices}
      initialYear={year}
      initialBusinessType={businessType}
    />
  )
}
