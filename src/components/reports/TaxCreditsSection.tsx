'use client'

import { Plus, Trash2 } from 'lucide-react'
import { formatAmount } from '@/lib/utils/format'
import type { TaxCredit } from '@/types/database'

const CREDIT_TYPES = [
  '연구및인력개발비 세액공제',
  '통합고용증대 세액공제',
  '통합투자 세액공제',
  '기장 세액공제',
  '성실신고 세액공제',
  '직접 입력',
]

// 기존 DB 데이터 → 신규 명칭 매핑 (저장값은 변경 안 함, 표시/저장 시 normalize)
const LEGACY_NAME_MAP: Record<string, string> = {
  '연구인력개발비': '연구및인력개발비 세액공제',
  '고용증가': '통합고용증대 세액공제',
  '통합투자': '통합투자 세액공제',
  '중소기업사회보험료': '기장 세액공제',
}

function normalizeCreditType(type: string): string {
  return LEGACY_NAME_MAP[type] ?? type
}

interface Props {
  credits: TaxCredit[]
  onChange: (credits: TaxCredit[]) => void
}

export function TaxCreditsSection({ credits, onChange }: Props) {
  function addRow() {
    onChange([
      ...credits,
      { type: CREDIT_TYPES[0], current_amount: 0, carryover_amount: 0 },
    ])
  }

  function updateRow(i: number, patch: Partial<TaxCredit>) {
    onChange(credits.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  function removeRow(i: number) {
    onChange(credits.filter((_, idx) => idx !== i))
  }

  const totalCurrent = credits.reduce((s, c) => s + c.current_amount, 0)
  const totalCarryover = credits.reduce((s, c) => s + c.carryover_amount, 0)

  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">세액공제</h3>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus size={14} /> 항목 추가
        </button>
      </div>

      {credits.length === 0 ? (
        <p className="px-6 py-4 text-sm text-gray-400">세액공제 항목 없음</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs">
              <th className="px-4 py-2.5 text-left font-medium">공제 구분</th>
              <th className="px-4 py-2.5 text-right font-medium w-44">당기 공제액</th>
              <th className="px-4 py-2.5 text-right font-medium w-44">이월 공제액</th>
              <th className="px-2 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {credits.map((credit, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <select
                    value={normalizeCreditType(credit.type)}
                    onChange={(e) =>
                      updateRow(i, { type: e.target.value, custom_name: undefined })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {CREDIT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  {credit.type === '직접 입력' && (
                    <input
                      type="text"
                      value={credit.custom_name ?? ''}
                      onChange={(e) => updateRow(i, { custom_name: e.target.value })}
                      placeholder="공제 항목명 입력"
                      className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={credit.current_amount || ''}
                    onChange={(e) =>
                      updateRow(i, { current_amount: Number(e.target.value) || 0 })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-right tabular-nums text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="0"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={credit.carryover_amount || ''}
                    onChange={(e) =>
                      updateRow(i, { carryover_amount: Number(e.target.value) || 0 })
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
                {formatAmount(totalCurrent)}원
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                {formatAmount(totalCarryover)}원
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  )
}
