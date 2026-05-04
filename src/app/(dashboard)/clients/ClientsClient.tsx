'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Trash2, Pencil, LogOut, ChevronUp, ChevronDown } from 'lucide-react'
import type { Client } from '@/types/database'
import { deleteClientAction, terminateClientAction } from './actions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Toast, { type ToastType } from '@/components/ui/Toast'
import ClientForm from '@/components/clients/ClientForm'
import { formatDate, formatCurrency, formatBusinessNumber } from '@/lib/utils/format'

type SortKey = 'number' | 'company_name' | 'start_date'
type SortDir = 'asc' | 'desc'

interface Props {
  initialClients: Client[]
}

export default function ClientsClient({ initialClients }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'전체' | '법인' | '개인'>('전체')
  const [sortKey, setSortKey] = useState<SortKey>('number')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Client | null>(null)
  const [terminateTarget, setTerminateTarget] = useState<Client | null>(null)
  const [terminationDate, setTerminationDate] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null
    return sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
  }

  const filtered = clients
    .filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.company_name.toLowerCase().includes(q) ||
        (c.number ?? '').toLowerCase().includes(q) ||
        (c.representative ?? '').toLowerCase().includes(q) ||
        (c.business_number ?? '').includes(q)
      const matchCategory =
        categoryFilter === '전체' || c.business_type_category === categoryFilter
      return matchSearch && matchCategory
    })
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'number') {
        return mul * ((a.number ?? '').localeCompare(b.number ?? '', 'ko'))
      }
      if (sortKey === 'company_name') {
        return mul * a.company_name.localeCompare(b.company_name, 'ko')
      }
      if (sortKey === 'start_date') {
        return mul * ((a.start_date ?? '').localeCompare(b.start_date ?? ''))
      }
      return 0
    })

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteClientAction(deleteTarget.id)
        setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id))
        setDeleteTarget(null)
        showToast('고객이 삭제되었습니다.', 'success')
      } catch {
        showToast('삭제에 실패했습니다.', 'error')
      }
    })
  }

  const handleTerminateConfirm = () => {
    if (!terminateTarget || !terminationDate) return
    startTransition(async () => {
      try {
        await terminateClientAction(terminateTarget.id, terminationDate)
        setClients((prev) => prev.filter((c) => c.id !== terminateTarget.id))
        setTerminateTarget(null)
        setTerminationDate('')
        showToast('해지 처리되었습니다.', 'success')
      } catch {
        showToast('해지 처리에 실패했습니다.', 'error')
      }
    })
  }

  return (
    <div>
      {/* 상단 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">기장고객 목록</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {filtered.length}명</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          고객 추가
        </Button>
      </div>

      {/* 검색/필터 */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상호명, 고객번호, 대표자 검색..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
          />
        </div>
        {(['전체', '법인', '개인'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                onClick={() => toggleSort('number')}
              >
                <span className="flex items-center gap-1">번호 <SortIcon k="number" /></span>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                onClick={() => toggleSort('company_name')}
              >
                <span className="flex items-center gap-1">상호명 <SortIcon k="company_name" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">구분</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">사업자번호</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">담당자</th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900"
                onClick={() => toggleSort('start_date')}
              >
                <span className="flex items-center gap-1">계약일 <SortIcon k="start_date" /></span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">계약금액</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                  {search ? '검색 결과가 없습니다.' : '등록된 고객이 없습니다.'}
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500">{client.number ?? '-'}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {client.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        client.business_type_category === '법인'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {client.business_type_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatBusinessNumber(client.business_number)}</td>
                  <td className="px-4 py-3 text-gray-700">{client.representative ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{client.manager ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(client.start_date)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(client.contract_amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTarget(client)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setTerminateTarget(client)
                          setTerminationDate(new Date().toISOString().slice(0, 10))
                        }}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="해지"
                      >
                        <LogOut size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(client)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 고객 추가 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="고객 추가"
        size="lg"
      >
        <ClientForm
          onSuccess={() => {
            setShowAddModal(false)
            showToast('고객이 등록되었습니다.', 'success')
            router.refresh()
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* 고객 수정 모달 */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="고객 수정"
        size="lg"
      >
        {editTarget && (
          <ClientForm
            client={editTarget}
            onSuccess={() => {
              setEditTarget(null)
              showToast('고객 정보가 수정되었습니다.', 'success')
              router.refresh()
            }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* 해지 확인 모달 */}
      <Modal
        isOpen={!!terminateTarget}
        onClose={() => setTerminateTarget(null)}
        title="고객 해지"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{terminateTarget?.company_name}</strong> 고객을 해지 처리하시겠습니까?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">해지일</label>
            <input
              type="date"
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setTerminateTarget(null)}>취소</Button>
            <Button variant="danger" onClick={handleTerminateConfirm} disabled={!terminationDate || isPending}>
              해지 처리
            </Button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="고객 삭제"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{deleteTarget?.company_name}</strong> 고객을 삭제하시겠습니까?
            <br />
            <span className="text-red-500 text-xs">이 작업은 되돌릴 수 없습니다.</span>
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={isPending}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
