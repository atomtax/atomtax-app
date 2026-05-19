import type { IncomeStatementSummary } from '@/types/database'
import {
  formatIncomeAmount,
  getIncomeStatementLabel,
  isLossAwareKey,
} from '@/lib/utils/income-statement-labels'

interface Props {
  periodLabel: string
  summary: IncomeStatementSummary
  /** true 면 법인세차감전이익/법인세등 행을 숨기고 당기순이익 번호를 Ⅷ로 재정렬 — 개인사업자(종소세) 보고서용 */
  hideCorporateTaxRows?: boolean
}

type NumericKey = Exclude<keyof IncomeStatementSummary, 'details'>

// 손실 부호에 따라 동적 라벨이 필요한 행은 staticLabel 대신 roman + 헬퍼로 표시 (PR #102)
interface RowDef {
  roman: string
  /** 정적 라벨 (손실 케이스 분기 없는 항목) */
  staticLabel?: string
  key: NumericKey
  bold?: boolean
}

const FULL_ROWS: RowDef[] = [
  { roman: 'Ⅰ', staticLabel: '매출액', key: 'revenue', bold: true },
  { roman: 'Ⅱ', staticLabel: '매출원가', key: 'cogs' },
  { roman: 'Ⅲ', staticLabel: '매출총이익', key: 'gross_profit', bold: true },
  { roman: 'Ⅳ', staticLabel: '판매비와 관리비', key: 'sga' },
  { roman: 'Ⅴ', key: 'operating_income', bold: true }, // 영업이익/손실 동적
  { roman: 'Ⅵ', staticLabel: '영업외수익', key: 'non_operating_revenue' },
  { roman: 'Ⅶ', staticLabel: '영업외비용', key: 'non_operating_expense' },
  { roman: 'Ⅷ', key: 'pretax_income' }, // 법인세차감전이익/손실 동적
  { roman: 'Ⅸ', staticLabel: '법인세등', key: 'corporate_tax' },
  { roman: 'Ⅹ', key: 'net_income', bold: true }, // 당기순이익/손실 동적
]

const INCOME_TAX_ROWS: RowDef[] = [
  { roman: 'Ⅰ', staticLabel: '매출액', key: 'revenue', bold: true },
  { roman: 'Ⅱ', staticLabel: '매출원가', key: 'cogs' },
  { roman: 'Ⅲ', staticLabel: '매출총이익', key: 'gross_profit', bold: true },
  { roman: 'Ⅳ', staticLabel: '판매비와 관리비', key: 'sga' },
  { roman: 'Ⅴ', key: 'operating_income', bold: true }, // 영업이익/손실 동적
  { roman: 'Ⅵ', staticLabel: '영업외수익', key: 'non_operating_revenue' },
  { roman: 'Ⅶ', staticLabel: '영업외비용', key: 'non_operating_expense' },
  { roman: 'Ⅷ', key: 'net_income', bold: true }, // 당기순이익/손실 동적
]

function rowLabel(row: RowDef, value: number): string {
  if (row.staticLabel) return `${row.roman}. ${row.staticLabel}`
  // 동적 라벨 행 — 손익 부호에 따라 이익/손실 분기
  if (isLossAwareKey(row.key)) {
    return `${row.roman}. ${getIncomeStatementLabel(row.key, value)}`
  }
  return row.roman
}

export function IncomeStatementTable({ periodLabel, summary, hideCorporateTaxRows }: Props) {
  const rows = hideCorporateTaxRows ? INCOME_TAX_ROWS : FULL_ROWS
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
          {rows.map((row) => {
            const value = Number(summary[row.key] ?? 0)
            const isNegative = value < 0
            return (
              <tr
                key={row.key}
                className={`border-b border-gray-100 ${row.bold ? 'bg-blue-50/40' : ''}`}
              >
                <td className={`px-5 py-2.5 ${row.bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {rowLabel(row, value)}
                </td>
                <td
                  className={`px-5 py-2.5 text-right tabular-nums ${
                    row.bold ? 'font-semibold' : ''
                  } ${isNegative ? 'text-red-600' : 'text-gray-700'} ${
                    row.bold && !isNegative ? 'text-gray-900' : ''
                  }`}
                >
                  {formatIncomeAmount(summary[row.key])}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
