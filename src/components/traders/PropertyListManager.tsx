'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, Building, FileText, FolderOpen } from 'lucide-react'
import { addProperty, updateProperty } from '@/app/actions/trader-properties'
import { PropertyRow } from './PropertyRow'
import type { TraderProperty } from '@/types/database'

interface Props {
  clientId: string
  initialProperties: TraderProperty[]
}

export function PropertyListManager({ clientId, initialProperties }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [properties, setProperties] = useState<TraderProperty[]>(initialProperties)
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set())
  const [expandedMeta, setExpandedMeta] = useState<Set<string>>(new Set())

  // 서버 측 데이터 변경(router.refresh) 시 클라이언트 state 동기화
  useEffect(() => {
    setProperties(initialProperties)
  }, [initialProperties])

  function handleAddRow() {
    startTransition(async () => {
      try {
        await addProperty(clientId)
        router.refresh()
      } catch (e) {
        alert(`행 추가 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  function toggleExpenseDetail(propertyId: string) {
    setExpandedExpenses((prev) => {
      const next = new Set(prev)
      if (next.has(propertyId)) next.delete(propertyId)
      else next.add(propertyId)
      return next
    })
  }

  function toggleMetaDetail(propertyId: string) {
    setExpandedMeta((prev) => {
      const next = new Set(prev)
      if (next.has(propertyId)) next.delete(propertyId)
      else next.add(propertyId)
      return next
    })
  }

  function handlePropertyChange(propertyId: string, updates: Partial<TraderProperty>) {
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, ...updates } : p)),
    )
  }

  function handleSaveAll() {
    startTransition(async () => {
      try {
        for (const p of properties) {
          await updateProperty(p.id, {
            transfer_amount: Number(p.transfer_amount) || 0,
            acquisition_date: p.acquisition_date,
            transfer_date: p.transfer_date,
            location: p.location,
            prepaid_income_tax: Number(p.prepaid_income_tax) || 0,
            prepaid_local_tax: Number(p.prepaid_local_tax) || 0,
            is_85_over: p.is_85_over,
            comparison_taxation: p.comparison_taxation,
            progress_status: p.progress_status,
          })
        }
        alert('저장되었습니다.')
        router.refresh()
      } catch (e) {
        alert(`저장 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Building size={20} className="text-indigo-600" />
          물건 목록
        </h2>
        <div className="flex items-center gap-2">
          <button
            disabled
            type="button"
            className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-sm rounded opacity-50 cursor-not-allowed flex items-center gap-1"
            title="v20b/c에서 활성화"
          >
            <FolderOpen size={14} /> 부동산 폴더
          </button>
          <button
            disabled
            type="button"
            className="px-3 py-1.5 bg-purple-100 text-purple-800 text-sm rounded opacity-50 cursor-not-allowed flex items-center gap-1"
            title="v20b/c에서 활성화"
          >
            <FileText size={14} /> 체크리스트
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">물건명</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">취득가액</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">기타필요경비</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">양도가액</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">양도소득</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">취득일</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">양도일</th>
              <th className="px-3 py-2 text-center font-semibold text-yellow-700 bg-yellow-50">
                신고기한
              </th>
            </tr>
          </thead>
          <tbody>
            {properties.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  물건이 없습니다. 아래 [+ 행 추가] 버튼을 눌러 추가하세요.
                </td>
              </tr>
            ) : (
              properties.map((property) => (
                <PropertyRow
                  key={property.id}
                  property={property}
                  isExpenseExpanded={expandedExpenses.has(property.id)}
                  isMetaExpanded={expandedMeta.has(property.id)}
                  onToggleExpense={() => toggleExpenseDetail(property.id)}
                  onToggleMeta={() => toggleMetaDetail(property.id)}
                  onChange={(updates) => handlePropertyChange(property.id, updates)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleAddRow}
          disabled={isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1 text-sm"
        >
          <Plus size={16} /> 행 추가
        </button>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isPending || properties.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 text-sm"
        >
          <Save size={16} /> 저장
        </button>
      </div>
    </div>
  )
}
