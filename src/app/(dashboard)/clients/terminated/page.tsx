import type { Metadata } from 'next'
import { getTerminatedClients } from '@/lib/db/clients'
import ClientListManager from '@/components/clients/ClientListManager'

export const metadata: Metadata = {
  title: '해지 고객',
}

export default async function TerminatedClientsPage() {
  const clients = await getTerminatedClients()
  return <ClientListManager initialClients={clients} isTerminated />
}
