'use client'

import { formatAmount } from '@/lib/utils/format'

interface Props {
  revenue: number | null
  netIncome: number | null
  onRevenueChange: (v: number | null) => void
  onNetIncomeChange: (v: number | null) => void
}

export function FinancialSummary({ revenue, netIncome, onRevenueChange, onNetIncomeChange }: Props) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">재무 현황</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">당기 매출액</label>
          <input
            type="number"
            value={revenue ?? ''}
            onChange={(e) =>
              onRevenueChange(e.target.value === '' ? null : Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right tabular-nums focus:outline-none focus:border-indigo-500"
            placeholder="0"
          />
          {revenue != null && (
            <p className="text-xs text-gray-500 mt-1 text-right">{formatAmount(revenue)}원</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">당기 순이익</label>
          <input
            type="number"
            value={netIncome ?? ''}
            onChange={(e) =>
              onNetIncomeChange(e.target.value === '' ? null : Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right tabular-nums focus:outline-none focus:border-indigo-500"
            placeholder="0"
          />
          {netIncome != null && (
            <p className="text-xs text-gray-500 mt-1 text-right">{formatAmount(netIncome)}원</p>
          )}
        </div>
      </div>
    </section>
  )
}
