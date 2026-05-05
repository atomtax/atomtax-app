import { getClients } from '@/lib/db/clients'
import { getAdjustmentInvoices } from '@/lib/db/invoices'
import AdjustmentInvoiceClient from './AdjustmentInvoiceClient'

export default async function AdjustmentInvoicePage() {
  const [clients, invoices] = await Promise.all([
    getClients(),
    getAdjustmentInvoices(),
  ])
  return <AdjustmentInvoiceClient clients={clients} initialInvoices={invoices} />
}
