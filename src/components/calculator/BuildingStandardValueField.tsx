'use client'

import { useState } from 'react'
import { Calculator } from 'lucide-react'
import {
  calculateBuildingStandardValue,
  findLocationBracket,
} from '@/lib/calculators/building-standard-value'
import { NumberInput } from './NumberInput'

interface Props {
  value: number
  onChange: (v: number) => void
  buildingArea: number
  landUnitPrice: number
  structureId: string
  usageId: string
  completionYear: string
}

export function BuildingStandardValueField({
  value,
  onChange,
  buildingArea,
  landUnitPrice,
  structureId,
  usageId,
  completionYear,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  const handleCalculate = () => {
    const missing: string[] = []
    if (!(buildingArea > 0)) missing.push('건물면적')
    if (!(landUnitPrice > 0)) missing.push('토지공시지가')
    if (!structureId) missing.push('구조')
    if (!usageId) missing.push('용도')
    const yearNum = parseInt(completionYear, 10)
    if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > 2100) {
      missing.push('신축연도')
    }
    if (missing.length > 0) {
      setError(`${missing.join(', ')} 입력 후 [자동계산]을 사용하세요.`)
      setHint(null)
      return
    }

    const result = calculateBuildingStandardValue({
      structureId,
      usageId,
      landUnitPrice,
      buildingArea,
      builtYear: yearNum,
    })

    if (!result) {
      setError('계산 실패. 입력값을 확인해주세요.')
      setHint(null)
      return
    }

    onChange(result.buildingStandardValue)
    setError(null)
    const bracket = findLocationBracket(landUnitPrice)
    setHint(
      `850,000 × ${result.structure.index}(구조) × ${result.usage.index}(용도) × ${
        bracket?.index ?? '-'
      }(위치) × ${result.residualRate.toFixed(3)}(잔가율, 경과 ${
        result.yearsElapsed
      }년) → ${result.perSqmRounded.toLocaleString('ko-KR')}원/㎡ × ${
        result.totalArea
      }㎡`,
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          건물기준시가 (전체 금액, 원){' '}
          <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={handleCalculate}
          className="text-xs px-2 py-1 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 inline-flex items-center gap-1"
          title="구조/용도/신축연도/건물면적/토지공시지가로 기준시가 산출"
        >
          <Calculator size={11} /> 자동계산
        </button>
      </div>

      <NumberInput
        value={value}
        onChange={(v) => {
          onChange(v)
          if (hint) setHint(null)
        }}
        placeholder="예: 265,800,000"
      />

      {error ? (
        <p className="text-xs text-orange-700">⚠️ {error}</p>
      ) : hint ? (
        <p className="text-xs text-blue-700">
          <span className="font-semibold">✓ 자동계산 완료</span> · {hint}
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          직접 입력하거나, 구조/용도/신축연도 입력 후 [자동계산]을 사용하세요
          (2025년 국세청 고시 기준).
        </p>
      )}
    </div>
  )
}
