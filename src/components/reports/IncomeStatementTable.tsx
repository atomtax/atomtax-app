import type { IncomeStatementSummary } from '@/types/database'
import { formatAmount } from '@/lib/utils/format'

interface Props {
  periodLabel: string
  summary: IncomeStatementSummary
}

const ROWS: Array<{ label: string; key: keyof IncomeStatementSummary; bold?: boolean }> = [
  { label: 'Ⅰ. 매출액', key: 'revenue', bold: true },
  { label: 'Ⅱ. 매출원가', key: 'cogs' },
  { label: 'Ⅲ. 매출총이익', key: 'gross_profit', bold: true },
  { label: 'Ⅳ. 판매비와 관리비', key: 'sga' },
  { label: 'Ⅴ. 영업이익', key: 'operating_income', bold: true },
  { label: 'Ⅵ. 영업외수익', key: 'non_operating_revenue' },
  { label: 'Ⅶ. 영업외비용', key: 'non_operating_expense' },
  { label: 'Ⅷ. 법인세차감전이익', key: 'pretax_income' },
  { label: 'Ⅸ. 법인세등', key: 'corporate_tax' },
  { label: 'Ⅹ. 당기순이익', key: 'net_income', bold: true },
]

export function IncomeStatementTable({ periodLabel, summary }: Props) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">손익계산서 요약</h3>
        {periodLabel && <p className="text-sm text-gray-500 mt-0.5">{periodLabel}</p>}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-blue-50 text-blue-900">
            <th className="px-5 py-3 text-left font-semibold">과 목</th>
            <th className="px-5 py-3 text-right font-semibold">금액 (원)</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr
              key={row.key}
              className={`border-b border-gray-100 ${row.bold ? 'bg-blue-50/40' : ''}`}
            >
              <td className={`px-5 py-2.5 ${row.bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                {row.label}
              </td>
              <td className={`px-5 py-2.5 text-right tabular-nums ${row.bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                {formatAmount(summary[row.key])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
