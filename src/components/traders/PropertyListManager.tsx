'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, Building, FileText, FolderOpen } from 'lucide-react'
import { addProperty, updateProperty, updatePropertyField } from '@/app/actions/trader-properties'
import { PropertyRow } from './PropertyRow'
import type { TraderProperty } from '@/types/database'

interface Props {
  clientId: string
  clientName: string
  clientFolder: string | null
  initialProperties: TraderProperty[]
}

export function PropertyListManager({
  clientId,
  clientName,
  clientFolder,
  initialProperties,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [properties, setProperties] = useState<TraderProperty[]>(initialProperties)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    setProperties(initialProperties)
  }, [initialProperties])

  // PR #124: tax_category 기준 2섹션 분리 (매매사업자/양도소득세)
  const tradeProperties = useMemo(
    () =>
      properties.filter(
        (p) => (p.tax_category ?? '매매사업자') === '매매사업자',
      ),
    [properties],
  )
  const transferTaxProperties = useMemo(
    () => properties.filter((p) => p.tax_category === '양도소득세'),
    [properties],
  )

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

  const toggleExpand = useCallback((propertyId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(propertyId)) next.delete(propertyId)
      else next.add(propertyId)
      return next
    })
  }, [])

  const handlePropertyChange = useCallback(
    (propertyId: string, updates: Partial<TraderProperty>) => {
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, ...updates } : p)),
      )
    },
    [],
  )

  /**
   * 단일 필드 즉시 저장 (PR #126) — 종류(property_type) / 세금 구분(tax_category).
   * 1. 낙관적 UI 업데이트
   * 2. 서버 액션 호출
   * 3. 실패 시 이전 값으로 롤백 + alert
   */
  const handleImmediateSaveField = useCallback(
    async (
      propertyId: string,
      field: 'property_type' | 'tax_category',
      value: string | null,
    ) => {
      const target = properties.find((p) => p.id === propertyId)
      if (!target) return
      const previous = target[field] as string | null

      // 1. 낙관적 업데이트
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, [field]: value } : p)),
      )

      // 2. 서버 저장
      try {
        await updatePropertyField(propertyId, field, value)
      } catch (e) {
        // 3. 실패 시 롤백
        setProperties((prev) =>
          prev.map((p) => (p.id === propertyId ? { ...p, [field]: previous } : p)),
        )
        alert(`저장 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    },
    [properties],
  )

  function handleSaveAll() {
    startTransition(async () => {
      try {
        // 직렬 await → 병렬 Promise.all (11개 물건이면 round-trip 11번 → 1번 분량)
        await Promise.all(
          properties.map((p) =>
            updateProperty(p.id, {
              transfer_amount: Number(p.transfer_amount) || 0,
              acquisition_date: p.acquisition_date,
              transfer_date: p.transfer_date,
              location: p.location,
              prepaid_income_tax: Number(p.prepaid_income_tax) || 0,
              prepaid_local_tax: Number(p.prepaid_local_tax) || 0,
              is_85_over: p.is_85_over,
              comparison_taxation: p.comparison_taxation,
              progress_status: p.progress_status,
            }),
          ),
        )
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
            title="v20d에서 활성화"
          >
            <FolderOpen size={14} /> 부동산 폴더
          </button>
          <button
            type="button"
            onClick={() =>
              window.open('/traders/checklist', '_blank', 'noopener,noreferrer')
            }
            className="px-3 py-1.5 bg-purple-100 text-purple-800 hover:bg-purple-200 text-sm rounded flex items-center gap-1"
            title="매매사업자 체크리스트를 새 탭으로 열기"
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
              <th className="px-3 py-2 text-center font-semibold text-gray-700">진행단계</th>
            </tr>
          </thead>
          <tbody>
            {properties.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  물건이 없습니다. 아래 [+ 행 추가] 버튼을 눌러 추가하세요.
                </td>
              </tr>
            ) : (
              <>
                {/* 매매사업자 섹션 (PR #124) — 종소세 합산 대상. 물건 없으면 섹션 자체 숨김 */}
                {tradeProperties.length > 0 && (
                  <>
                    <tr className="bg-purple-50 border-y-2 border-purple-300">
                      <td
                        colSpan={9}
                        className="px-3 py-2 text-xs font-extrabold tracking-wider text-brand"
                      >
                        매매사업자 · {tradeProperties.length}건 (종소세 합산 대상)
                      </td>
                    </tr>
                    {tradeProperties.map((property) => (
                      <PropertyRow
                        key={property.id}
                        property={property}
                        clientName={clientName}
                        clientFolder={clientFolder}
                        isExpanded={expandedRows.has(property.id)}
                        onToggle={toggleExpand}
                        onChange={handlePropertyChange}
                        onImmediateSaveField={handleImmediateSaveField}
                      />
                    ))}
                  </>
                )}
                {/* 양도소득세 섹션 (PR #124) — 합산 제외, 체크리스트만 */}
                {transferTaxProperties.length > 0 && (
                  <>
                    {/* 두 섹션 동시 표시 시 큰 수직 여백 (PR #125) — 시각적 분리 명확화 */}
                    {tradeProperties.length > 0 && (
                      <tr aria-hidden="true">
                        <td colSpan={9} className="h-10 bg-white p-0" />
                      </tr>
                    )}
                    <tr className="bg-amber-50 border-y-2 border-amber-300">
                      <td
                        colSpan={9}
                        className="px-3 py-2 text-xs font-extrabold tracking-wider text-amber-700"
                      >
                        양도소득세 · {transferTaxProperties.length}건 (합산 제외 · 체크리스트만)
                      </td>
                    </tr>
                    {transferTaxProperties.map((property) => (
                      <PropertyRow
                        key={property.id}
                        property={property}
                        clientName={clientName}
                        clientFolder={clientFolder}
                        isExpanded={expandedRows.has(property.id)}
                        onToggle={toggleExpand}
                        onChange={handlePropertyChange}
                        onImmediateSaveField={handleImmediateSaveField}
                      />
                    ))}
                  </>
                )}
              </>
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
