'use client'

import { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  calculateFilingDeadline,
  calculateTransferIncome,
} from '@/lib/calculators/property'
import { PROGRESS_STYLES } from '@/lib/constants/property-progress'
import { autoFormatDate } from '@/lib/utils/format-date'
import {
  formatNumberWithCommas,
  parseNumberFromCommas,
} from '@/lib/utils/format-number'
import type { TraderProperty } from '@/types/database'

// 펼침 시에만 로드 (초기 로딩 가벼움)
const PropertyDetailPanel = dynamic(
  () => import('./PropertyDetailPanel').then((m) => m.PropertyDetailPanel),
  {
    loading: () => (
      <div className="px-4 py-6 text-center text-gray-400 text-sm border-l-4 border-indigo-300 bg-gray-50">
        로드 중...
      </div>
    ),
  },
)

interface Props {
  property: TraderProperty
  isExpanded: boolean
  onToggle: () => void
  onChange: (updates: Partial<TraderProperty>) => void
}

function PropertyRowImpl({ property, isExpanded, onToggle, onChange }: Props) {
  const transferIncome = useMemo(
    () =>
      calculateTransferIncome(
        Number(property.transfer_amount) || 0,
        Number(property.acquisition_amount) || 0,
        Number(property.other_expenses) || 0,
      ),
    [property.transfer_amount, property.acquisition_amount, property.other_expenses],
  )

  const filingDeadline = useMemo(
    () => calculateFilingDeadline(property.transfer_date),
    [property.transfer_date],
  )

  const progressStyle = PROGRESS_STYLES[property.progress_status]

  // input 셀 클릭 시 행 펼침 트리거 차단
  const stopToggle = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <>
      <tr
        className="border-b border-gray-100 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <td className="px-3 py-2">
          <span className="text-indigo-600 font-medium">
            {property.property_name}
            <span className="ml-1 text-xs text-gray-400">{isExpanded ? '▾' : '▸'}</span>
          </span>
        </td>
        <td className="px-3 py-2 text-right tabular-nums bg-blue-50">
          {Number(property.acquisition_amount).toLocaleString('ko-KR')}
        </td>
        <td className="px-3 py-2 text-right tabular-nums bg-green-50">
          {Number(property.other_expenses).toLocaleString('ko-KR')}
        </td>
        <td className="px-3 py-2" onClick={stopToggle}>
          <input
            type="text"
            inputMode="numeric"
            value={formatNumberWithCommas(property.transfer_amount)}
            onChange={(e) =>
              onChange({ transfer_amount: parseNumberFromCommas(e.target.value) })
            }
            placeholder="0"
            className="w-full px-2 py-1 text-right border border-gray-200 rounded tabular-nums focus:border-indigo-500 focus:outline-none"
          />
        </td>
        <td
          className={`px-3 py-2 text-right tabular-nums font-medium ${
            transferIncome < 0 ? 'text-red-600 bg-yellow-50' : 'bg-yellow-50'
          }`}
        >
          {transferIncome.toLocaleString('ko-KR')}
        </td>
        <td className="px-3 py-2" onClick={stopToggle}>
          <input
            type="text"
            value={property.acquisition_date ?? ''}
            onChange={(e) => onChange({ acquisition_date: e.target.value || null })}
            onBlur={(e) => {
              const formatted = autoFormatDate(e.target.value)
              if (formatted !== e.target.value) {
                onChange({ acquisition_date: formatted })
              }
            }}
            placeholder="20250101"
            className="w-28 px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
          />
        </td>
        <td className="px-3 py-2" onClick={stopToggle}>
          <input
            type="text"
            value={property.transfer_date ?? ''}
            onChange={(e) => onChange({ transfer_date: e.target.value || null })}
            onBlur={(e) => {
              const formatted = autoFormatDate(e.target.value)
              if (formatted !== e.target.value) {
                onChange({ transfer_date: formatted })
              }
            }}
            placeholder="20250405"
            className="w-28 px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
          />
        </td>
        <td className="px-3 py-2 text-center text-xs bg-yellow-50">{filingDeadline ?? '—'}</td>
        <td className="px-3 py-2 text-center">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${progressStyle.bg} ${progressStyle.text} ${progressStyle.border}`}
          >
            {property.progress_status}
          </span>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-gray-200 bg-gray-50">
          <td colSpan={9} className="p-0">
            <PropertyDetailPanel
              property={property}
              onChange={onChange}
              onCollapse={onToggle}
            />
          </td>
        </tr>
      )}
    </>
  )
}

export const PropertyRow = memo(PropertyRowImpl)
