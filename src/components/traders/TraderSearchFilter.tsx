'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Building2, ChevronRight, Search } from 'lucide-react'
import type { TraderClientManagerGroup, TraderClientSummary } from '@/lib/db/trader-properties'

interface Props {
  groups: TraderClientManagerGroup[]
}

export function TraderSearchFilter({ groups }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedManager, setSelectedManager] = useState<string>('전체')

  const managers = useMemo(
    () => ['전체', ...groups.map((g) => g.manager)],
    [groups],
  )

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return groups
      .filter((g) => selectedManager === '전체' || g.manager === selectedManager)
      .map((g) => ({
        ...g,
        clients: g.clients.filter((c) => {
          if (!term) return true
          return (
            c.company_name.toLowerCase().includes(term) ||
            (c.business_number ?? '').includes(searchTerm.trim())
          )
        }),
      }))
      .filter((g) => g.clients.length > 0)
  }, [groups, searchTerm, selectedManager])

  const totalFiltered = filteredGroups.reduce((sum, g) => sum + g.clients.length, 0)
  const isFiltering = searchTerm.trim() !== '' || selectedManager !== '전체'

  return (
    <>
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="회사명 또는 사업자번호 검색..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded focus:border-indigo-500 focus:outline-none text-sm"
          />
        </div>

        <select
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
        >
          {managers.map((m) => (
            <option key={m} value={m}>
              {m === '전체' ? '담당자 전체' : m}
            </option>
          ))}
        </select>

        {isFiltering && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('')
              setSelectedManager('전체')
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            초기화
          </button>
        )}

        <span className="text-sm text-gray-500 whitespace-nowrap">
          {totalFiltered}개 표시
        </span>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>{isFiltering ? '검색 결과가 없습니다.' : '등록된 매매사업자가 없습니다.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <ManagerGroupCard
              key={group.manager}
              manager={group.manager}
              clients={group.clients}
            />
          ))}
        </div>
      )}
    </>
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
