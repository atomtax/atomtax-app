'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronUp,
  Calculator,
  FileSearch,
  FileText,
  FolderOpen,
  Save,
  Trash2,
} from 'lucide-react'
import {
  deleteProperty,
  getExpenses,
  saveExpensesAndProperty,
} from '@/app/actions/trader-properties'
import { EXPENSE_NAMES } from '@/lib/constants/property-expense'
import { PROGRESS_OPTIONS, PROGRESS_STYLES } from '@/lib/constants/property-progress'
import {
  TRADER_EXPENSE_CATEGORY_OPTIONS,
  type TraderExpenseCategory,
  type TraderProperty,
  type TraderPropertyExpense,
} from '@/types/database'

interface Props {
  property: TraderProperty
  onChange: (updates: Partial<TraderProperty>) => void
  onCollapse: () => void
}

export function PropertyDetailPanel({ property, onChange, onCollapse }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [propertyName, setPropertyName] = useState(property.property_name)
  const [expenses, setExpenses] = useState<TraderPropertyExpense[]>([])
  const [loading, setLoading] = useState(true)

  // 펼침 시 필요경비 로드
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getExpenses(property.id)
      .then((data) => {
        if (!cancelled) {
          setExpenses(data)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          alert(`필요경비 로드 실패: ${e instanceof Error ? e.message : String(e)}`)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [property.id])

  // 외부에서 property_name 변경 시 입력 칸 동기화
  useEffect(() => {
    setPropertyName(property.property_name)
  }, [property.property_name])

  function updateExpense(index: number, updates: Partial<TraderPropertyExpense>) {
    setExpenses((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  function clearExpense(index: number) {
    setExpenses((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              expense_name: null,
              category: '취득가액',
              amount: 0,
              predeclaration_allowed: true,
              income_tax_allowed: true,
              memo: null,
            }
          : r,
      ),
    )
  }

  function handleSaveAll() {
    startTransition(async () => {
      try {
        await saveExpensesAndProperty(
          property.id,
          {
            property_name: propertyName,
            location: property.location,
            prepaid_income_tax: Number(property.prepaid_income_tax) || 0,
            prepaid_local_tax: Number(property.prepaid_local_tax) || 0,
            is_85_over: property.is_85_over,
            comparison_taxation: property.comparison_taxation,
            progress_status: property.progress_status,
            transfer_amount: Number(property.transfer_amount) || 0,
            acquisition_date: property.acquisition_date,
            transfer_date: property.transfer_date,
          },
          expenses.map((r) => ({
            row_no: r.row_no,
            expense_name: r.expense_name,
            category: r.category,
            amount: Number(r.amount) || 0,
            predeclaration_allowed: r.predeclaration_allowed,
            income_tax_allowed: r.income_tax_allowed,
            memo: r.memo,
          })),
        )
        alert('저장 및 반영되었습니다.')
        router.refresh()
      } catch (e) {
        alert(`저장 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  function handleDelete() {
    if (!confirm(`"${property.property_name}" 물건을 삭제하시겠습니까?`)) return
    startTransition(async () => {
      try {
        await deleteProperty(property.id)
        router.refresh()
      } catch (e) {
        alert(`삭제 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  const acquisitionTotal = useMemo(
    () =>
      expenses
        .filter((r) => r.predeclaration_allowed && r.category === '취득가액')
        .reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [expenses],
  )

  const otherExpensesTotal = useMemo(
    () =>
      expenses
        .filter((r) => r.predeclaration_allowed && r.category === '기타필요경비')
        .reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [expenses],
  )

  const progressStyle = PROGRESS_STYLES[property.progress_status]

  return (
    <div className="px-4 py-4 border-l-4 border-indigo-400">
      {/* 헤더: 물건명 수정 + 접기 */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-sm font-bold text-gray-700">물건명</label>
          <input
            type="text"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="물건명 입력"
            className="flex-1 max-w-sm px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-gray-100"
          title="접기"
        >
          <ChevronUp size={14} /> 접기
        </button>
      </div>

      {/* 메타 정보 그리드 */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">소재지</label>
          <input
            type="text"
            value={property.location ?? ''}
            onChange={(e) => onChange({ location: e.target.value || null })}
            placeholder="소재지"
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">기납부 종소세</label>
          <input
            type="number"
            value={property.prepaid_income_tax || ''}
            onChange={(e) =>
              onChange({ prepaid_income_tax: Number(e.target.value) || 0 })
            }
            placeholder="0"
            className="w-full px-2 py-1 text-right border border-gray-200 rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">기납부 지방소득세</label>
          <input
            type="number"
            value={property.prepaid_local_tax || ''}
            onChange={(e) =>
              onChange({ prepaid_local_tax: Number(e.target.value) || 0 })
            }
            placeholder="0"
            className="w-full px-2 py-1 text-right border border-gray-200 rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">85㎡ 초과</label>
          <select
            value={property.is_85_over ? 'Y' : 'N'}
            onChange={(e) => onChange({ is_85_over: e.target.value === 'Y' })}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="N">N</option>
            <option value="Y">Y</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">비교과세</label>
          <select
            value={property.comparison_taxation ? 'Y' : 'N'}
            onChange={(e) =>
              onChange({ comparison_taxation: e.target.value === 'Y' })
            }
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="N">N</option>
            <option value="Y">Y</option>
          </select>
        </div>
      </div>

      {/* 진행단계 + 액션 버튼 */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">진행단계</label>
          <select
            value={property.progress_status}
            onChange={(e) =>
              onChange({
                progress_status: e.target.value as TraderProperty['progress_status'],
              })
            }
            className={`px-3 py-1 border rounded text-sm focus:border-indigo-500 focus:outline-none ${progressStyle.bg} ${progressStyle.text} ${progressStyle.border}`}
          >
            {PROGRESS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled
            type="button"
            className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded opacity-50 cursor-not-allowed flex items-center gap-1"
            title="v20d에서 활성화"
          >
            <FolderOpen size={11} /> 서류 업로드
          </button>
          <button
            disabled
            type="button"
            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded opacity-50 cursor-not-allowed flex items-center gap-1"
            title="v20d에서 활성화"
          >
            <FileSearch size={11} /> 입력참고용
          </button>
          <button
            disabled
            type="button"
            className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded opacity-50 cursor-not-allowed flex items-center gap-1"
            title="v20d에서 활성화"
          >
            <Calculator size={11} /> 세금계산
          </button>
          <button
            disabled
            type="button"
            className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded opacity-50 cursor-not-allowed flex items-center gap-1"
            title="v20d에서 활성화"
          >
            <FileText size={11} /> 보고서
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs rounded flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 size={11} /> 삭제
          </button>
        </div>
      </div>

      {/* 필요경비 상세 */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-gray-700 mb-2">📋 필요경비 상세</h3>
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm bg-white border border-gray-200 rounded">
            필요경비 상세 로드 중...
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600 w-8">no</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-600">비용명</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-600">구분</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600 w-24">금액</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600 w-16">
                    예정
                    <br />
                    신고
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600 w-16">
                    종소세
                    <br />
                    인정
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-600">비고</th>
                  <th className="px-2 py-2 text-center w-12 font-semibold text-gray-600">삭제</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((row, idx) => (
                  <tr
                    key={`${row.row_no}-${idx}`}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-2 py-1 text-center text-gray-500">{row.row_no}</td>
                    <td className="px-2 py-1">
                      <select
                        value={row.expense_name ?? ''}
                        onChange={(e) =>
                          updateExpense(idx, { expense_name: e.target.value || null })
                        }
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">선택</option>
                        {EXPENSE_NAMES.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.category}
                        onChange={(e) =>
                          updateExpense(idx, {
                            category: e.target.value as TraderExpenseCategory,
                          })
                        }
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        {TRADER_EXPENSE_CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={row.amount || ''}
                        onChange={(e) =>
                          updateExpense(idx, { amount: Number(e.target.value) || 0 })
                        }
                        placeholder="0"
                        className="w-full px-1 py-0.5 text-right border border-gray-200 rounded tabular-nums text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <select
                        value={row.predeclaration_allowed ? 'O' : 'X'}
                        onChange={(e) =>
                          updateExpense(idx, {
                            predeclaration_allowed: e.target.value === 'O',
                          })
                        }
                        className="px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="O">O</option>
                        <option value="X">X</option>
                      </select>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <select
                        value={row.income_tax_allowed ? 'O' : 'X'}
                        onChange={(e) =>
                          updateExpense(idx, { income_tax_allowed: e.target.value === 'O' })
                        }
                        className="px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="O">O</option>
                        <option value="X">X</option>
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={row.memo ?? ''}
                        onChange={(e) =>
                          updateExpense(idx, { memo: e.target.value || null })
                        }
                        placeholder="비고"
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => clearExpense(idx)}
                        className="text-gray-400 hover:text-red-600 px-1"
                        title="행 비우기"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-indigo-50 border-t border-indigo-200 font-semibold">
                <tr>
                  <td colSpan={3} className="px-2 py-2 text-right text-gray-700">
                    취득가액 합계:
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-indigo-700">
                    {acquisitionTotal.toLocaleString('ko-KR')} 원
                  </td>
                  <td colSpan={4}></td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-2 py-2 text-right text-gray-700">
                    기타필요경비 합계:
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-indigo-700">
                    {otherExpensesTotal.toLocaleString('ko-KR')} 원
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">
        💡 예정신고 비용인정이 <strong>O</strong>인 항목만 합계에 포함됩니다. [저장 및 반영]을
        누르면 메인 표의 모든 정보(물건명·취득가액·기타필요경비·양도소득)가 업데이트됩니다.
      </p>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isPending}
          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          <Save size={14} />
          {isPending ? '저장 중...' : '저장 및 반영'}
        </button>
      </div>
    </div>
  )
}
