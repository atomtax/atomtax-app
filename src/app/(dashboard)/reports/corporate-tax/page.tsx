import { getClients } from '@/lib/db/clients'
import { getCorporateTaxReports } from '@/lib/db/reports'
import CorporateTaxClient from './CorporateTaxClient'

export default async function CorporateTaxPage() {
  const [clients, reports] = await Promise.all([
    getClients(),
    getCorporateTaxReports(),
  ])
  return <CorporateTaxClient clients={clients} initialReports={reports} />
}
