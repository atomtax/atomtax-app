import type { Metadata } from 'next'
import { getClients } from '@/lib/db/clients'
import ClientListManager from '@/components/clients/ClientListManager'

export const metadata: Metadata = {
  title: '고객 관리',
}

export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientListManager initialClients={clients} />
}
