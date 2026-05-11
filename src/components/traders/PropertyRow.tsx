'use client'

import {
  calculateTransferIncome,
  calculateFilingDeadline,
} from '@/lib/calculators/property'
import { TRADER_PROGRESS_STATUS_OPTIONS, type TraderProperty } from '@/types/database'
import { PropertyExpenseDetail } from './PropertyExpenseDetail'

interface Props {
  property: TraderProperty
  isExpenseExpanded: boolean
  isMetaExpanded: boolean
  onToggleExpense: () => void
  onToggleMeta: () => void
  onChange: (updates: Partial<TraderProperty>) => void
}

export function PropertyRow({
  property,
  isExpenseExpanded,
  isMetaExpanded,
  onToggleExpense,
  onToggleMeta,
  onChange,
}: Props) {
  const transferIncome = calculateTransferIncome(
    Number(property.transfer_amount) || 0,
    Number(property.acquisition_amount) || 0,
    Number(property.other_expenses) || 0,
  )

  const filingDeadline = calculateFilingDeadline(property.transfer_date)

  // input/date 셀 클릭 시 메타 펼침 트리거 차단
  const stopMetaToggle = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-3 py-2">
          <button
            type="button"
            onClick={onToggleExpense}
            className="text-indigo-600 hover:underline font-medium"
          >
            {property.property_name}
            <span className="ml-1 text-xs">{isExpenseExpanded ? '▾' : '▸'}</span>
          </button>
        </td>
        <td
          className="px-3 py-2 text-right tabular-nums bg-blue-50 cursor-pointer"
          onClick={onToggleMeta}
        >
          {Number(property.acquisition_amount).toLocaleString('ko-KR')}
        </td>
        <td
          className="px-3 py-2 text-right tabular-nums bg-green-50 cursor-pointer"
          onClick={onToggleMeta}
        >
          {Number(property.other_expenses).toLocaleString('ko-KR')}
        </td>
        <td className="px-3 py-2" onClick={stopMetaToggle}>
          <input
            type="number"
            value={property.transfer_amount || ''}
            onChange={(e) => onChange({ transfer_amount: Number(e.target.value) || 0 })}
            placeholder="0"
            className="w-full px-2 py-1 text-right border border-gray-200 rounded tabular-nums focus:border-indigo-500 focus:outline-none"
          />
        </td>
        <td
          className={`px-3 py-2 text-right tabular-nums font-medium cursor-pointer ${
            transferIncome < 0 ? 'text-red-600 bg-yellow-50' : 'bg-yellow-50'
          }`}
          onClick={onToggleMeta}
        >
          {transferIncome.toLocaleString('ko-KR')}
        </td>
        <td className="px-3 py-2" onClick={stopMetaToggle}>
          <input
            type="date"
            value={property.acquisition_date ?? ''}
            onChange={(e) => onChange({ acquisition_date: e.target.value || null })}
            className="px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
          />
        </td>
        <td className="px-3 py-2" onClick={stopMetaToggle}>
          <input
            type="date"
            value={property.transfer_date ?? ''}
            onChange={(e) => onChange({ transfer_date: e.target.value || null })}
            className="px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
          />
        </td>
        <td
          className="px-3 py-2 text-center text-xs bg-yellow-50 cursor-pointer"
          onClick={onToggleMeta}
        >
          {filingDeadline ?? '-'}
        </td>
      </tr>

      {isExpenseExpanded && (
        <tr className="border-b border-gray-200">
          <td colSpan={8} className="p-0">
            <PropertyExpenseDetail propertyId={property.id} />
          </td>
        </tr>
      )}

      {isMetaExpanded && (
        <tr className="border-b border-gray-200 bg-gray-50">
          <td colSpan={8} className="px-3 py-3">
            <div className="grid grid-cols-6 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">소재지</label>
                <input
                  type="text"
                  value={property.location ?? ''}
                  onChange={(e) => onChange({ location: e.target.value || null })}
                  placeholder="소재지"
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">기납부 종소세</label>
                <input
                  type="number"
                  value={property.prepaid_income_tax || ''}
                  onChange={(e) =>
                    onChange({ prepaid_income_tax: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-2 py-1 text-right border border-gray-200 rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  기납부 지방소득세
                </label>
                <input
                  type="number"
                  value={property.prepaid_local_tax || ''}
                  onChange={(e) =>
                    onChange({ prepaid_local_tax: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-2 py-1 text-right border border-gray-200 rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">85㎡ 초과</label>
                <select
                  value={property.is_85_over ? 'Y' : 'N'}
                  onChange={(e) => onChange({ is_85_over: e.target.value === 'Y' })}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="N">N</option>
                  <option value="Y">Y</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">비교과세</label>
                <select
                  value={property.comparison_taxation ? 'Y' : 'N'}
                  onChange={(e) =>
                    onChange({ comparison_taxation: e.target.value === 'Y' })
                  }
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="N">N</option>
                  <option value="Y">Y</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">진행단계</label>
                <select
                  value={property.progress_status}
                  onChange={(e) =>
                    onChange({
                      progress_status: e.target.value as TraderProperty['progress_status'],
                    })
                  }
                  className="px-3 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {TRADER_PROGRESS_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled
                  type="button"
                  className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded opacity-50 cursor-not-allowed"
                  title="v20b/c에서 활성화"
                >
                  서류 업로드
                </button>
                <button
                  disabled
                  type="button"
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded opacity-50 cursor-not-allowed"
                  title="v20b/c에서 활성화"
                >
                  입력참고용
                </button>
                <button
                  disabled
                  type="button"
                  className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded opacity-50 cursor-not-allowed"
                  title="v20b/c에서 활성화"
                >
                  세금계산
                </button>
                <button
                  disabled
                  type="button"
                  className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded opacity-50 cursor-not-allowed"
                  title="v20b/c에서 활성화"
                >
                  보고서
                </button>
                <button
                  disabled
                  type="button"
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded opacity-50 cursor-not-allowed"
                  title="v20b/c에서 활성화"
                >
                  삭제
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
