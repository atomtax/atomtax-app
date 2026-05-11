import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTraderClient, listPropertiesByClient } from '@/lib/db/trader-properties'
import { PropertyListManager } from '@/components/traders/PropertyListManager'

interface Props {
  params: Promise<{ clientId: string }>
}

export default async function TraderClientPage({ params }: Props) {
  const { clientId } = await params

  const client = await getTraderClient(clientId)
  if (!client) {
    return (
      <div className="p-6">
        <p className="mb-3">고객을 찾을 수 없습니다.</p>
        <Link href="/traders" className="text-indigo-600 underline">
          ← 목록으로
        </Link>
      </div>
    )
  }

  const properties = await listPropertiesByClient(clientId)

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Link
        href="/traders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4"
      >
        <ArrowLeft size={16} /> 목록으로
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{client.company_name}</h1>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          {client.business_number && <span>사업자번호: {client.business_number}</span>}
          {client.manager && <span>담당자: {client.manager}</span>}
        </div>
      </div>

      <PropertyListManager
        clientId={clientId}
        clientName={client.company_name}
        clientFolder={client.trader_drive_folder_url}
        initialProperties={properties}
      />
    </div>
  )
}
