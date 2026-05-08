import { formatAmount } from '@/lib/utils/format'

const RATE_LABELS: Record<number, string> = {
  2025: '9% / 19% / 21% / 24%',
  2026: '10% / 20% / 22% / 25%',
}

interface Props {
  netIncome: number | null
  carryoverLoss: number
  taxableIncome: number
  calculatedTax: number
  totalCredits: number
  totalReductions: number
  determinedTax: number
  localTax: number
  ruralSpecialTax: number
  prepaidTax: number
  finalTax: number
  year: number
  onCarryoverLossChange: (v: number) => void
  onPrepaidTaxChange: (v: number) => void
}

function AmtCell({ value }: { value: number }) {
  return (
    <td className="px-5 py-3 text-right tabular-nums text-gray-900">
      {formatAmount(value)}원
    </td>
  )
}

function InputCell({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <td className="px-5 py-2.5 text-right">
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-44 px-2 py-1 border border-gray-300 rounded text-right tabular-nums text-sm focus:outline-none focus:border-indigo-500"
        placeholder="0"
      />
    </td>
  )
}

export function TaxCalculationSection({
  netIncome,
  carryoverLoss,
  taxableIncome,
  calculatedTax,
  totalCredits,
  totalReductions,
  determinedTax,
  localTax,
  ruralSpecialTax,
  prepaidTax,
  finalTax,
  year,
  onCarryoverLossChange,
  onPrepaidTaxChange,
}: Props) {
  const rateLabel = RATE_LABELS[year] ?? RATE_LABELS[2025]

  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">세금 계산</h3>
        <span className="text-xs text-gray-500">{year}년 세율: {rateLabel}</span>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {/* 과세표준 */}
          <tr className="border-b border-gray-100">
            <td className="px-5 py-3 text-gray-700">당기순이익</td>
            <AmtCell value={netIncome ?? 0} />
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-5 py-3 text-gray-700">
              <span className="text-gray-400 mr-1">(−)</span>이월결손금
            </td>
            <InputCell value={carryoverLoss} onChange={onCarryoverLossChange} />
          </tr>
          <tr className="border-b border-gray-200 bg-blue-50/40">
            <td className="px-5 py-3 font-semibold text-gray-900">과세표준</td>
            <td className="px-5 py-3 text-right tabular-nums font-semibold text-gray-900">
              {formatAmount(taxableIncome)}원
            </td>
          </tr>

          {/* 세액 */}
          <tr className="border-b border-gray-100">
            <td className="px-5 py-3 text-gray-700">산출세액</td>
            <AmtCell value={calculatedTax} />
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-5 py-3 text-gray-700">
              <span className="text-gray-400 mr-1">(−)</span>세액공제 합계
            </td>
            <AmtCell value={totalCredits} />
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-5 py-3 text-gray-700">
              <span className="text-gray-400 mr-1">(−)</span>세액감면 합계
            </td>
            <AmtCell value={totalReductions} />
          </tr>
          <tr className="border-b border-gray-200 bg-blue-50/40">
            <td className="px-5 py-3 font-semibold text-gray-900">결정세액</td>
            <td className="px-5 py-3 text-right tabular-nums font-semibold text-gray-900">
              {formatAmount(determinedTax)}원
            </td>
          </tr>

          {/* 추가 세액 */}
          <tr className="border-b border-gray-100">
            <td className="px-5 py-3 text-gray-700">
              <span className="text-gray-400 mr-1">(+)</span>지방소득세 (10%)
            </td>
            <AmtCell value={localTax} />
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-5 py-3 text-gray-700">
              <span className="text-gray-400 mr-1">(+)</span>농어촌특별세 (감면액 20%)
            </td>
            <AmtCell value={ruralSpecialTax} />
          </tr>
          <tr className="border-b border-gray-200">
            <td className="px-5 py-3 text-gray-700">
              <span className="text-gray-400 mr-1">(−)</span>기납부세액
            </td>
            <InputCell value={prepaidTax} onChange={onPrepaidTaxChange} />
          </tr>

          {/* 최종 */}
          <tr className="bg-indigo-50">
            <td className="px-5 py-4 font-bold text-indigo-900 text-base">최종 납부세액</td>
            <td className="px-5 py-4 text-right tabular-nums font-bold text-indigo-900 text-base">
              {formatAmount(finalTax)}원
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
