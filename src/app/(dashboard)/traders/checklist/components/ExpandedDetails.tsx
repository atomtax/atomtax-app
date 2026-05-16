'use client'

import { formatNumberWithCommas } from '@/lib/utils/format-number'
import type { TraderProperty } from '@/types/database'

interface Props {
  property: TraderProperty
}

export function ExpandedDetails({ property }: Props) {
  const grossTransferAmount = Number(property.transfer_amount) || 0
  const vatAmount = Number(property.vat_amount) || 0
  const netTransferAmount = Math.max(0, grossTransferAmount - vatAmount)
  const acquisitionAmount = Number(property.acquisition_amount) || 0
  const otherExpenses = Number(property.other_expenses) || 0
  const transferIncome = Number(property.transfer_income) || 0
  const landArea = Number(property.land_area) || 0
  const buildingArea = Number(property.building_area) || 0

  // 매매사업자 상세에서 입력/저장된 실제 기납부 세액(= [세금계산] 결과)을 그대로 표시.
  // 종전 양도차익 합산을 반영한 값이라 단순 bracket(transfer_income) 추정과는 다름.
  const incomeTax = Number(property.prepaid_income_tax) || 0
  const localTax = Number(property.prepaid_local_tax) || 0

  return (
    <div className="bg-gray-50 border-l-4 border-indigo-300 p-4 text-sm">
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 tabular-nums">
        <Cell
          label="양도가액 (차감 후)"
          value={`${formatNumberWithCommas(netTransferAmount) || '0'} 원`}
        />
        <Cell label="토지면적" value={`${formatNumberWithCommas(landArea) || '0'} m²`} />
        <Cell label="취득가액" value={`${formatNumberWithCommas(acquisitionAmount) || '0'} 원`} />
        <Cell label="건물면적" value={`${formatNumberWithCommas(buildingArea) || '0'} m²`} />
        <Cell
          label="기타필요경비"
          value={`${formatNumberWithCommas(otherExpenses) || '0'} 원`}
        />
        <Cell
          label="양도소득"
          value={`${formatNumberWithCommas(transferIncome) || '0'} 원`}
          highlight={transferIncome < 0 ? 'red' : 'orange'}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-x-8 gap-y-1 tabular-nums">
        <Cell
          label="기납부 종소세"
          value={`${formatNumberWithCommas(incomeTax) || '0'} 원`}
          subtle
        />
        <Cell
          label="기납부 지방소득세"
          value={`${formatNumberWithCommas(localTax) || '0'} 원`}
          subtle
        />
      </div>
    </div>
  )
}

function Cell({
  label,
  value,
  highlight,
  subtle,
}: {
  label: string
  value: string
  highlight?: 'orange' | 'red'
  subtle?: boolean
}) {
  let valueClass = 'text-gray-900 font-medium'
  if (highlight === 'red') valueClass = 'text-red-600 font-bold'
  else if (highlight === 'orange') valueClass = 'text-orange-700 font-bold'
  else if (subtle) valueClass = 'text-blue-700 font-medium'

  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-600">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}
