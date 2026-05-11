'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'
import { getExpenses, saveExpenses } from '@/app/actions/trader-properties'
import { EXPENSE_NAMES } from '@/lib/constants/property-expense'
import {
  TRADER_EXPENSE_CATEGORY_OPTIONS,
  type TraderExpenseCategory,
  type TraderPropertyExpense,
} from '@/types/database'

interface Props {
  propertyId: string
}

export function PropertyExpenseDetail({ propertyId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rows, setRows] = useState<TraderPropertyExpense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getExpenses(propertyId)
      .then((data) => {
        if (!cancelled) {
          setRows(data)
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
  }, [propertyId])

  function updateRow(index: number, updates: Partial<TraderPropertyExpense>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  function clearRow(index: number) {
    setRows((prev) =>
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

  function handleSave() {
    startTransition(async () => {
      try {
        await saveExpenses(
          propertyId,
          rows.map((r) => ({
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

  const acquisitionTotal = useMemo(
    () =>
      rows
        .filter((r) => r.predeclaration_allowed && r.category === '취득가액')
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    [rows],
  )

  const otherExpensesTotal = useMemo(
    () =>
      rows
        .filter((r) => r.predeclaration_allowed && r.category === '기타필요경비')
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    [rows],
  )

  if (loading) {
    return (
      <div className="bg-gray-50 px-4 py-6 text-center text-gray-400 text-sm border-l-4 border-indigo-300">
        필요경비 상세 로드 중...
      </div>
    )
  }

  return (
    <div className="bg-gray-50 px-4 py-4 border-l-4 border-indigo-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700">📋 필요경비 상세</h3>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
        >
          <Save size={12} /> {isPending ? '저장 중...' : '저장 및 반영'}
        </button>
      </div>

      <div className="overflow-x-auto bg-white border border-gray-200 rounded">
        <table className="w-full text-xs">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-2 py-2 text-center font-semibold text-gray-600 w-8">no</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">비용명</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">구분</th>
              <th className="px-2 py-2 text-right font-semibold text-gray-600">금액</th>
              <th className="px-2 py-2 text-center font-semibold text-gray-600">
                예정신고
                <br />
                비용인정
              </th>
              <th className="px-2 py-2 text-center font-semibold text-gray-600">
                종합소득세
                <br />
                비용인정
              </th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">비고</th>
              <th className="px-2 py-2 text-center w-8">삭제</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.row_no}-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-1 text-center text-gray-500">{row.row_no}</td>
                <td className="px-2 py-1">
                  <select
                    value={row.expense_name ?? ''}
                    onChange={(e) => updateRow(idx, { expense_name: e.target.value || null })}
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
                      updateRow(idx, { category: e.target.value as TraderExpenseCategory })
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
                    onChange={(e) => updateRow(idx, { amount: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-1 py-0.5 text-right border border-gray-200 rounded tabular-nums text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <select
                    value={row.predeclaration_allowed ? 'O' : 'X'}
                    onChange={(e) =>
                      updateRow(idx, { predeclaration_allowed: e.target.value === 'O' })
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
                      updateRow(idx, { income_tax_allowed: e.target.value === 'O' })
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
                    onChange={(e) => updateRow(idx, { memo: e.target.value || null })}
                    placeholder="비고"
                    className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => clearRow(idx)}
                    className="text-gray-400 hover:text-red-600"
                    title="행 비우기"
                  >
                    <Trash2 size={12} />
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

      <p className="text-xs text-gray-500 mt-2">
        💡 예정신고 비용인정이 <strong>O</strong>인 항목만 합계에 포함됩니다. [저장 및 반영] 버튼을
        누르면 위 메인 표의 취득가액·기타필요경비·양도소득이 자동 업데이트됩니다.
      </p>
    </div>
  )
}
