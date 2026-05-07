import { getClients } from '@/lib/db/clients'
import ClientListManager from '@/components/clients/ClientListManager'

export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientListManager initialClients={clients} />
}
