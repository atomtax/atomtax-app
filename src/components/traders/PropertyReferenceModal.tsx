'use client'

import { X } from 'lucide-react'
import { calculateIncomeTax } from '@/lib/calculators/income-tax'
import { formatNumberWithCommas } from '@/lib/utils/format-number'
import type { TraderProperty } from '@/types/database'

interface Props {
  property: TraderProperty
  onClose: () => void
}

export function PropertyReferenceModal({ property, onClose }: Props) {
  const transferAmount = Number(property.transfer_amount) || 0
  const acquisitionAmount = Number(property.acquisition_amount) || 0
  const otherExpenses = Number(property.other_expenses) || 0
  const transferIncome = Number(property.transfer_income) || 0

  let calculatedTax = 0
  let appliedRate = 0
  if (transferIncome > 0) {
    const result = calculateIncomeTax(transferIncome)
    calculatedTax = result.tax
    appliedRate = result.rate
  }

  const prepaidIncomeTax = Number(property.prepaid_income_tax) || 0
  const payableTotal = calculatedTax - prepaidIncomeTax

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              📋 입력 참고용 — 토지등 매매차익 예정신고서
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              현재 입력된 데이터를 기반으로 토지등 매매차익 예정신고서의 예상 값을 보여줍니다. 실제
              신고 시에는 정확한 계산을 다시 확인해주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              3. 토지등 매매차익 예정신고서
            </h3>
            <table className="w-full border border-gray-300 text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50">매매가액 (실거래가액)</td>
                  <td className="px-3 py-2 text-center bg-gray-50 w-12">5</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumberWithCommas(transferAmount)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50">필요경비</td>
                  <td className="px-3 py-2 text-center bg-gray-50">6</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumberWithCommas(acquisitionAmount + otherExpenses)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50">
                    장기보유특별공제 전 토지등매매차익
                  </td>
                  <td className="px-3 py-2 text-center bg-gray-50">7</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumberWithCommas(transferIncome)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200 bg-yellow-50">
                  <td className="px-3 py-2 font-medium">토지등 매매차익</td>
                  <td className="px-3 py-2 text-center">8</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatNumberWithCommas(transferIncome)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50">기본공제(공제)된 매매차익합계액</td>
                  <td className="px-3 py-2 text-center bg-gray-50">9</td>
                  <td className="px-3 py-2 text-right tabular-nums">-</td>
                </tr>
                <tr className="border-b border-gray-200 bg-yellow-50">
                  <td className="px-3 py-2 font-medium">토지등 매매차익 합계액 (8+9)</td>
                  <td className="px-3 py-2 text-center">10</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatNumberWithCommas(transferIncome)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="px-3 py-2">양도소득세 세율</td>
                  <td className="px-3 py-2 text-center">11</td>
                  <td className="px-3 py-2 text-right tabular-nums text-blue-700 font-medium">
                    {appliedRate}%
                  </td>
                </tr>
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="px-3 py-2 font-bold">산출세액</td>
                  <td className="px-3 py-2 text-center">12</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-blue-700">
                    {formatNumberWithCommas(calculatedTax)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50">가산세</td>
                  <td className="px-3 py-2 text-center bg-gray-50">13</td>
                  <td className="px-3 py-2 text-right tabular-nums">-</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50">기납부세액</td>
                  <td className="px-3 py-2 text-center bg-gray-50">14</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumberWithCommas(prepaidIncomeTax)}
                  </td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-3 py-2 font-bold">납부할 종액 (12+13-14)</td>
                  <td className="px-3 py-2 text-center">15</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-orange-700">
                    {formatNumberWithCommas(payableTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-3">📅 신고 정보</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoCell label="양도일" value={property.transfer_date ?? '-'} />
              <InfoCell label="신고기한" value={property.filing_deadline ?? '-'} />
              <InfoCell
                label="예정신고 과세표준"
                value={`${formatNumberWithCommas(transferIncome) || '0'} 원`}
              />
              <InfoCell
                label={`납부세액 (${appliedRate}%)`}
                value={`${formatNumberWithCommas(calculatedTax) || '0'} 원`}
                highlight
              />
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoCell({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`p-3 rounded border ${
        highlight
          ? 'bg-orange-50 border-orange-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p
        className={`text-sm font-medium tabular-nums ${
          highlight ? 'text-orange-700' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
