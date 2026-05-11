import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'
import {
  listTraderClientsGroupedByManager,
  type TraderClientSummary,
} from '@/lib/db/trader-properties'

export default async function TradersListPage() {
  const groups = await listTraderClientsGroupedByManager()
  const totalCount = groups.reduce((sum, g) => sum + g.clients.length, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-indigo-600" />
            매매사업자 데이터
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            업종코드 703011, 703012 · 총 {totalCount}개 사업자
          </p>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        매매사업자 목록은 고객 관리에서 <strong>업종코드 703011, 703012</strong>로 자동 표시됩니다.{' '}
        고객 정보는{' '}
        <Link href="/clients" className="underline">
          고객 관리
        </Link>
        에서 수정하세요.
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>등록된 매매사업자가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <ManagerGroupCard key={group.manager} manager={group.manager} clients={group.clients} />
          ))}
        </div>
      )}
    </div>
  )
}

function ManagerGroupCard({
  manager,
  clients,
}: {
  manager: string
  clients: TraderClientSummary[]
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="px-5 py-3 flex items-center gap-2 text-white font-semibold"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <span>👤</span>
        <span>{manager}</span>
        <span className="opacity-80 text-sm">({clients.length}개)</span>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/traders/${client.id}`}
            className="px-4 py-3 border border-gray-200 rounded-lg hover:border-indigo-400 hover:shadow-sm transition group flex items-center justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">
                {client.company_name}
              </p>
              {client.business_number && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{client.business_number}</p>
              )}
            </div>
            <ChevronRight
              size={16}
              className="text-gray-300 group-hover:text-indigo-500 flex-shrink-0"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
