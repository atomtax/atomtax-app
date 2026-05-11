'use client'

import { useRef, useState } from 'react'
import { Download, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import { calculateIncomeTax } from '@/lib/calculators/income-tax'
import { formatNumberWithCommas } from '@/lib/utils/format-number'
import type { TraderProperty } from '@/types/database'

interface Props {
  property: TraderProperty
  clientName: string
  onClose: () => void
}

export function PropertyReportModal({ property, clientName, onClose }: Props) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const transferAmount = Number(property.transfer_amount) || 0
  const acquisitionAmount = Number(property.acquisition_amount) || 0
  const otherExpenses = Number(property.other_expenses) || 0
  const transferIncome = Number(property.transfer_income) || 0
  const prepaidIncomeTax = Number(property.prepaid_income_tax) || 0
  const prepaidLocalTax = Number(property.prepaid_local_tax) || 0

  let appliedRate = 0
  if (transferIncome > 0) {
    appliedRate = calculateIncomeTax(transferIncome).rate
  }

  const totalTax = prepaidIncomeTax + prepaidLocalTax

  const today = new Date()
  const todayIso = today.toISOString().split('T')[0]
  const todayLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

  async function handleDownload() {
    if (!reportRef.current) return

    setDownloading(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const link = document.createElement('a')
      const filename = `토지등매매차익예정신고보고서_${clientName}_${property.property_name}_${todayIso}.png`
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      alert(`다운로드 실패: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-bold text-gray-700">📄 보고서 미리보기</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              <Download size={14} />
              {downloading ? '생성 중...' : 'PNG 다운로드'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div ref={reportRef} className="p-8 bg-white" style={{ minWidth: '600px' }}>
          <div
            className="text-center mb-6 pb-4"
            style={{ borderBottom: '3px solid #5b6cf0' }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              토지등 매매차익 예정신고 보고서
            </h1>
            <p className="text-sm text-gray-500">{todayLabel}</p>
          </div>

          <div className="bg-gray-50 rounded p-4 mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">고객사명</p>
              <p className="font-bold text-gray-900">{clientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">물건명</p>
              <p className="font-bold text-gray-900">{property.property_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">양도일</p>
              <p className="text-gray-900">{property.transfer_date ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">취득일</p>
              <p className="text-gray-900">{property.acquisition_date ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">납부기한</p>
              <p className="text-gray-900">{property.filing_deadline ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">비교과세</p>
              <p className="text-gray-900">
                <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                  {property.comparison_taxation ? 'Y' : 'N'}
                </span>
              </p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                }}
              >
                <th className="px-4 py-3 text-left">항목</th>
                <th className="px-4 py-3 text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-2.5">양도가액</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatNumberWithCommas(transferAmount) || '0'}원
                </td>
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="px-4 py-2.5">취득가액</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatNumberWithCommas(acquisitionAmount) || '0'}원
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-2.5">필요경비</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatNumberWithCommas(otherExpenses) || '0'}원
                </td>
              </tr>
              <tr
                className="border-b-2"
                style={{ background: '#fff7ed', borderColor: '#fb923c' }}
              >
                <td className="px-4 py-2.5 font-bold text-orange-900">
                  양도차익 (양도소득)
                </td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums font-bold ${
                    transferIncome < 0 ? 'text-red-600' : 'text-orange-900'
                  }`}
                >
                  {transferIncome.toLocaleString('ko-KR')}원
                </td>
              </tr>
              <tr className="border-b border-gray-200 bg-blue-50">
                <td className="px-4 py-2.5 text-blue-900">세율</td>
                <td className="px-4 py-2.5 text-right text-blue-900 font-medium">
                  {appliedRate}%
                </td>
              </tr>
              <tr className="border-b border-gray-200 bg-blue-50">
                <td className="px-4 py-2.5 text-blue-900">종합소득세</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-blue-900 font-medium">
                  {formatNumberWithCommas(prepaidIncomeTax) || '0'}원
                </td>
              </tr>
              <tr className="border-b border-gray-200 bg-blue-50">
                <td className="px-4 py-2.5 text-blue-900">지방소득세</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-blue-900 font-medium">
                  {formatNumberWithCommas(prepaidLocalTax) || '0'}원
                </td>
              </tr>
              <tr style={{ background: '#fff7ed' }}>
                <td className="px-4 py-3 font-bold text-orange-900">💰 총 세금</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-orange-900 text-lg">
                  {formatNumberWithCommas(totalTax) || '0'}원
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-gray-400 text-center mt-6 pt-3 border-t border-gray-100">
            이 보고서는 아톰세무회계 내부 업무 시스템에서 자동 생성되었습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
