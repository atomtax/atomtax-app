'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, RotateCcw, Trash2 } from 'lucide-react'
import type { Client } from '@/types/database'
import { restoreClientAction, deleteClientAction } from '../actions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Toast, { type ToastType } from '@/components/ui/Toast'
import { formatDate, formatBusinessNumber } from '@/lib/utils/format'

interface Props {
  initialClients: Client[]
}

export default function TerminatedClientsClient({ initialClients }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [restoreTarget, setRestoreTarget] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.company_name.toLowerCase().includes(q) ||
      (c.number ?? '').toLowerCase().includes(q)
    )
  })

  const handleRestore = () => {
    if (!restoreTarget) return
    startTransition(async () => {
      try {
        await restoreClientAction(restoreTarget.id)
        setClients((prev) => prev.filter((c) => c.id !== restoreTarget.id))
        setRestoreTarget(null)
        setToast({ message: '고객이 복원되었습니다.', type: 'success' })
        router.refresh()
      } catch {
        setToast({ message: '복원에 실패했습니다.', type: 'error' })
      }
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteClientAction(deleteTarget.id)
        setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id))
        setDeleteTarget(null)
        setToast({ message: '고객이 삭제되었습니다.', type: 'success' })
      } catch {
        setToast({ message: '삭제에 실패했습니다.', type: 'error' })
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">해지고객 목록</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {filtered.length}명</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="상호명, 고객번호 검색..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">번호</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">상호명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">구분</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">사업자번호</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">해지일</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">작업</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  해지된 고객이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{client.number ?? '-'}</td>
                  <td className="px-4 py-3 font-medium text-gray-700">{client.company_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      client.business_type_category === '법인'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      {client.business_type_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatBusinessNumber(client.business_number)}</td>
                  <td className="px-4 py-3 text-gray-700">{client.representative ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(client.termination_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setRestoreTarget(client)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="복원"
                      >
                        <RotateCcw size={14} />
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

      <Modal isOpen={!!restoreTarget} onClose={() => setRestoreTarget(null)} title="고객 복원" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{restoreTarget?.company_name}</strong> 고객을 기장고객으로 복원하시겠습니까?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setRestoreTarget(null)}>취소</Button>
            <Button onClick={handleRestore} disabled={isPending}>복원</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="고객 삭제" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{deleteTarget?.company_name}</strong> 고객을 완전 삭제하시겠습니까?
            <br />
            <span className="text-red-500 text-xs">이 작업은 되돌릴 수 없습니다.</span>
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="danger" onClick={handleDelete} disabled={isPending}>삭제</Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
