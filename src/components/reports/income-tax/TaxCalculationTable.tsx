'use client'

import type { IncomeTaxReport } from '@/types/database'
import { formatNumber } from '@/lib/utils/format'
import {
  formatNumberWithCommas,
  parseNumberFromCommas,
} from '@/lib/utils/format-number'

interface Props {
  data: IncomeTaxReport
  onChange: <K extends keyof IncomeTaxReport>(key: K, value: IncomeTaxReport[K]) => void
}

interface RowDef {
  label: string
  sublabel?: string
  incomeKey: keyof IncomeTaxReport
  ruralKey: keyof IncomeTaxReport
  type: 'input' | 'auto'
  emphasize?: boolean
  highlight?: 'green'
  ruralDisabled?: boolean
}

const ROWS: RowDef[] = [
  { label: '종합소득금액',               incomeKey: 'income_total',            ruralKey: 'rural_total',            type: 'input' },
  { label: '소득공제계',                 incomeKey: 'income_deduction',        ruralKey: 'rural_deduction',        type: 'input' },
  { label: '과세표준',                   incomeKey: 'income_tax_base',         ruralKey: 'rural_tax_base',         type: 'auto', emphasize: true },
  { label: '세율',                       incomeKey: 'income_applied_rate',     ruralKey: 'income_applied_rate',    type: 'auto', ruralDisabled: true },
  { label: '산출세액',                   incomeKey: 'income_calculated_tax',   ruralKey: 'rural_calculated_tax',   type: 'input', emphasize: true },
  { label: '세액감면',                   incomeKey: 'income_tax_reduction',    ruralKey: 'rural_tax_reduction',    type: 'input' },
  { label: '세액공제',                   incomeKey: 'income_tax_credit',       ruralKey: 'rural_tax_credit',       type: 'input' },
  { label: '결정세액 — 종합과세', sublabel: '(산출 − 감면 − 공제)', incomeKey: 'income_comprehensive_tax', ruralKey: 'rural_comprehensive_tax', type: 'auto' },
  { label: '결정세액 — 분리과세',        incomeKey: 'income_separate_tax',     ruralKey: 'rural_separate_tax',     type: 'input' },
  { label: '결정세액 합계',       sublabel: '(종합 + 분리)', incomeKey: 'income_determined_total', ruralKey: 'rural_determined_total', type: 'auto', emphasize: true },
  { label: '가산세',                     incomeKey: 'income_penalty_tax',      ruralKey: 'rural_penalty_tax',      type: 'input' },
  { label: '추가납부세액',               incomeKey: 'income_additional_tax',   ruralKey: 'rural_additional_tax',   type: 'input' },
  { label: '합계',                sublabel: '(결정 + 가산 + 추가)', incomeKey: 'income_total_tax', ruralKey: 'rural_total_tax', type: 'auto', emphasize: true },
  { label: '기납부세액계',               incomeKey: 'income_prepaid_tax',      ruralKey: 'rural_prepaid_tax',      type: 'input' },
  { label: '납부(환급)할 총세액',        incomeKey: 'income_payable',          ruralKey: 'rural_payable',          type: 'auto', emphasize: true },
  { label: '주식매수 특례 — 차감',       incomeKey: 'income_stock_deduct',     ruralKey: 'rural_stock_deduct',     type: 'input' },
  { label: '주식매수 특례 — 가산',       incomeKey: 'income_stock_add',        ruralKey: 'rural_stock_add',        type: 'input' },
  { label: '분납할세액',                 incomeKey: 'income_installment',      ruralKey: 'rural_installment',      type: 'input' },
  { label: '신고기한내 납부할 세액', sublabel: '(총세액 − 차감 + 가산 − 분납)', incomeKey: 'income_within_deadline', ruralKey: 'rural_within_deadline', type: 'auto', emphasize: true },
  { label: '국세환급금 충당',            incomeKey: 'income_refund_offset',    ruralKey: 'income_refund_offset',   type: 'input', ruralDisabled: true },
  { label: '충당후 납부(환급)할 세액',   incomeKey: 'income_final_payable',    ruralKey: 'rural_final_payable',    type: 'auto', emphasize: true },
  { label: '지방소득세', sublabel: '(충당후 세액 × 10%)', incomeKey: 'income_local_tax', ruralKey: 'income_local_tax', type: 'auto', ruralDisabled: true },
  { label: '농어촌특별세', sublabel: '(홈택스 입력)', incomeKey: 'farm_special_tax', ruralKey: 'farm_special_tax', type: 'input', ruralDisabled: true },
  { label: '최종 납부할 세액', sublabel: '(지방세 + 농특세 포함)', incomeKey: 'income_final_with_local', ruralKey: 'income_final_with_local', type: 'auto', emphasize: true, highlight: 'green', ruralDisabled: true },
]

export function TaxCalculationTable({ data, onChange }: Props) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold">세액의 계산</h3>
        <p className="text-sm text-gray-500 mt-1">
          홈택스 표와 동일한 구조. 입력란을 채우거나 위 붙여넣기를 이용하시면 자동 계산됩니다.
        </p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="bg-blue-50 text-blue-900 text-sm border-b border-blue-200">
            <th className="px-4 py-3 text-left w-2/5">구분</th>
            <th className="px-4 py-3 text-right w-[30%]">종합소득세</th>
            <th className="px-4 py-3 text-right w-[30%]">농어촌특별세</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, idx) => {
            const isFinal = row.highlight === 'green'
            const rowClass = isFinal
              ? 'bg-green-50'
              : row.emphasize
              ? 'bg-blue-50/40 font-semibold'
              : ''

            return (
              <tr key={idx} className={`border-b border-gray-100 ${rowClass}`}>
                <td className="px-4 py-2.5">
                  <div className="text-sm">{row.label}</div>
                  {row.sublabel && (
                    <div className="text-xs text-gray-400 mt-0.5">{row.sublabel}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <CellInput
                    value={Number(data[row.incomeKey] ?? 0)}
                    readonly={row.type === 'auto'}
                    isPercent={row.label === '세율'}
                    isFinal={isFinal}
                    onChange={(v) => onChange(row.incomeKey, v as IncomeTaxReport[typeof row.incomeKey])}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  {row.ruralDisabled ? (
                    <span className="text-xs text-gray-300 px-2">—</span>
                  ) : (
                    <CellInput
                      value={Number(data[row.ruralKey] ?? 0)}
                      readonly={row.type === 'auto'}
                      isFinal={isFinal}
                      onChange={(v) => onChange(row.ruralKey, v as IncomeTaxReport[typeof row.ruralKey])}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

interface CellInputProps {
  value: number
  readonly: boolean
  isPercent?: boolean
  isFinal?: boolean
  onChange: (v: number) => void
}

function CellInput({ value, readonly, isPercent, isFinal, onChange }: CellInputProps) {
  const isNegative = value < 0

  if (readonly) {
    return (
      <div
        className={`text-right tabular-nums px-2 py-1 text-sm ${
          isNegative ? 'text-red-600 font-semibold' : isFinal ? 'text-green-700 font-bold' : ''
        }`}
      >
        {isPercent ? `${value}%` : isNegative ? `△ ${formatNumber(Math.abs(value))}` : formatNumber(value)}
      </div>
    )
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value === 0 ? '' : formatNumberWithCommas(value)}
      onChange={(e) => onChange(parseNumberFromCommas(e.target.value))}
      placeholder="0"
      className="w-full px-2 py-1 border border-gray-200 rounded text-right tabular-nums text-sm focus:border-blue-500 focus:outline-none"
    />
  )
}
