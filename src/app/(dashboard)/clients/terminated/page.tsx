import { getTerminatedClients } from '@/lib/db/clients'
import TerminatedClientsClient from './TerminatedClientsClient'

export default async function TerminatedClientsPage() {
  const clients = await getTerminatedClients()
  return <TerminatedClientsClient initialClients={clients} />
}
