import { getClients } from '@/lib/db/clients'
import ClientsClient from './ClientsClient'

export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientsClient initialClients={clients} />
}
