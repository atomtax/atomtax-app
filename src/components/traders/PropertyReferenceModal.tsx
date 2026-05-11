'use client'

import { X } from 'lucide-react'
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
  const necessaryExpensesTotal = acquisitionAmount + otherExpenses
  const transferIncome = Number(property.transfer_income) || 0

  const landArea = Number(property.land_area) || 0
  const buildingArea = Number(property.building_area) || 0
  const totalArea = landArea + buildingArea

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
              현재 입력된 데이터를 기반으로 작성한 예정신고서 미리보기입니다.
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

        <div className="p-6 space-y-5">
          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">(8) 부동산 거래계약</h3>
            <table className="w-full border border-gray-300 text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50 w-32">(9) 거래일자</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-xs text-gray-500">양도일</span>
                        <span className="ml-2 font-medium">
                          {property.transfer_date ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">취득일</span>
                        <span className="ml-2 font-medium">
                          {property.acquisition_date ?? '-'}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50">부동산 소재지</td>
                  <td className="px-3 py-2 font-medium">{property.location ?? '-'}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">(10) 양도면적</h3>
            <table className="w-full border border-gray-300 text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50 w-32">토지</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumberWithCommas(landArea) || '0'} m²
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50">건물</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumberWithCommas(buildingArea) || '0'} m²
                  </td>
                </tr>
                <tr className="bg-yellow-50">
                  <td className="px-3 py-2 font-medium">총면적</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatNumberWithCommas(totalArea) || '0'} m²
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-800 mb-2">
              (11) 매매가액 / 필요경비
            </h3>
            <table className="w-full border border-gray-300 text-sm">
              <tbody>
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="px-3 py-2 font-medium w-12 text-center">11</td>
                  <td className="px-3 py-2 font-medium">매매가액</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatNumberWithCommas(transferAmount) || '0'} 원
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50 text-center">12</td>
                  <td className="px-3 py-2 bg-gray-50">취득가액</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumberWithCommas(acquisitionAmount) || '0'} 원
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50 text-center">13</td>
                  <td className="px-3 py-2 bg-gray-50">자본적 지출액</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-400">-</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50 text-center">14</td>
                  <td className="px-3 py-2 bg-gray-50">양도비</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatNumberWithCommas(otherExpenses) || '0'} 원
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50 text-center">15</td>
                  <td className="px-3 py-2 bg-gray-50">감정자금충당이자</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-400">-</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50 text-center">16</td>
                  <td className="px-3 py-2 bg-gray-50">공과금</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-400">-</td>
                </tr>
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="px-3 py-2 font-medium text-center">17</td>
                  <td className="px-3 py-2 font-medium">필요경비 계 (12~16)</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatNumberWithCommas(necessaryExpensesTotal) || '0'} 원
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-2 bg-gray-50 text-center">18</td>
                  <td className="px-3 py-2 bg-gray-50">장기보유특별공제</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-400">-</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-3 py-2 font-bold text-center text-orange-700">19</td>
                  <td className="px-3 py-2 font-bold text-orange-700">
                    매매차익 (11-17-18)
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums font-bold ${
                      transferIncome < 0 ? 'text-red-600' : 'text-orange-700'
                    }`}
                  >
                    {transferIncome.toLocaleString('ko-KR')} 원
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <p className="text-xs text-gray-500 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            💡 실제 신고 시에는 정확한 계산을 다시 확인해주세요. 자본적 지출액, 감정자금충당이자,
            공과금, 장기보유특별공제는 현재 시스템에서 입력받지 않으며, 필요 시 홈택스에서 직접
            입력하세요.
          </p>
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
