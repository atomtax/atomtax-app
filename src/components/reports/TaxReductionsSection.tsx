'use client'

import { Plus, Trash2 } from 'lucide-react'
import { formatAmount } from '@/lib/utils/format'
import type { TaxReduction } from '@/types/database'

const REDUCTION_TYPES = ['중소기업특별세액감면', '창업중소기업감면', '직접 입력']

interface Props {
  reductions: TaxReduction[]
  onChange: (reductions: TaxReduction[]) => void
}

export function TaxReductionsSection({ reductions, onChange }: Props) {
  function addRow() {
    onChange([...reductions, { type: '중소기업특별세액감면', current_amount: 0 }])
  }

  function updateRow(i: number, patch: Partial<TaxReduction>) {
    onChange(reductions.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  function removeRow(i: number) {
    onChange(reductions.filter((_, idx) => idx !== i))
  }

  const total = reductions.reduce((s, r) => s + r.current_amount, 0)

  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">세액감면</h3>
          {total > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">
              감면액의 20% 농어촌특별세 부과 ({formatAmount(Math.round(total * 0.2))}원)
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus size={14} /> 항목 추가
        </button>
      </div>

      {reductions.length === 0 ? (
        <p className="px-6 py-4 text-sm text-gray-400">세액감면 항목 없음</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs">
              <th className="px-4 py-2.5 text-left font-medium">감면 구분</th>
              <th className="px-4 py-2.5 text-right font-medium w-52">감면액</th>
              <th className="px-2 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {reductions.map((reduction, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <select
                    value={reduction.type}
                    onChange={(e) =>
                      updateRow(i, { type: e.target.value, custom_name: undefined })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {REDUCTION_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  {reduction.type === '직접 입력' && (
                    <input
                      type="text"
                      value={reduction.custom_name ?? ''}
                      onChange={(e) => updateRow(i, { custom_name: e.target.value })}
                      placeholder="감면 항목명 입력"
                      className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={reduction.current_amount || ''}
                    onChange={(e) =>
                      updateRow(i, { current_amount: Number(e.target.value) || 0 })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-right tabular-nums text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="0"
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium text-sm">
              <td className="px-4 py-2.5 text-gray-700">합계</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                {formatAmount(total)}원
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  )
}
