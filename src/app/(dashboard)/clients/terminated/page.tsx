import { getTerminatedClients } from '@/lib/db/clients'
import ClientListManager from '@/components/clients/ClientListManager'

export default async function TerminatedClientsPage() {
  const clients = await getTerminatedClients()
  return <ClientListManager initialClients={clients} isTerminated />
}
