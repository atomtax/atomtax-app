'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { TemporaryClientModal } from '@/components/clients/TemporaryClientModal'

interface Props {
  currentYear: number
  currentManager: string
  currentQuery: string
  managers: string[]
}

export function IncomeTaxFilters({ currentYear, currentManager, currentQuery, managers }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(currentQuery)
  const [showTempModal, setShowTempModal] = useState(false)

  const thisYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => thisYear - i)

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    router.push(`/reports/income-tax?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    update('q', query)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <select
        value={currentYear}
        onChange={(e) => update('year', e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>{y}년</option>
        ))}
      </select>

      <select
        value={currentManager}
        onChange={(e) => update('manager', e.target.value)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
      >
        <option value="all">전체 담당자</option>
        {managers.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
        <option value="미배정">미배정</option>
      </select>

      <form onSubmit={handleSearch} className="flex gap-1">
        <input
          type="text"
          placeholder="거래처명 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-48 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 text-gray-700"
        >
          검색
        </button>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowTempModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Plus size={15} />
          일회성 고객 추가
        </button>
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <RefreshCw size={15} />
          고객사 새로고침
        </button>
      </div>

      {showTempModal && (
        <TemporaryClientModal
          onClose={() => setShowTempModal(false)}
          buildRedirectUrl={(c) => `/reports/income-tax/${c.id}?year=${currentYear}`}
        />
      )}
    </div>
  )
}
