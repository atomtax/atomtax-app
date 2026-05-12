'use client'

import { useMemo, useState } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import {
  STRUCTURES,
  USAGES,
  FISCAL_YEAR,
} from '@/lib/calculators/building-standard-data'
import {
  calculateBuildingStandardValue,
  findLocationBracket,
} from '@/lib/calculators/building-standard-value'
import { DecimalInput, NumberInput } from './NumberInput'

interface Props {
  /** 폼에 이미 입력된 토지공시지가 (원/㎡) — 위치지수 자동 매핑 */
  landUnitPrice: number
  /** 폼에 이미 입력된 건물면적 (㎡) — 기본값으로 사용 */
  defaultBuildingArea: number
  /** 계산 완료 시 호출 — 부모 폼에 buildingStandardValue 자동 입력 */
  onApply: (buildingStandardValue: number) => void
  onClose: () => void
}

const DEFAULT_STRUCTURE_ID = 'cheolgeun'
const DEFAULT_USAGE_ID = 'apartment'

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')} 원`
}

export function BuildingValueCalculator({
  landUnitPrice,
  defaultBuildingArea,
  onApply,
  onClose,
}: Props) {
  const [structureId, setStructureId] = useState(DEFAULT_STRUCTURE_ID)
  const [usageId, setUsageId] = useState(DEFAULT_USAGE_ID)
  const [buildingArea, setBuildingArea] = useState<number>(defaultBuildingArea)
  const [builtYear, setBuiltYear] = useState<number>(FISCAL_YEAR)

  const result = useMemo(
    () =>
      calculateBuildingStandardValue({
        structureId,
        usageId,
        landUnitPrice,
        buildingArea,
        builtYear,
      }),
    [structureId, usageId, landUnitPrice, buildingArea, builtYear],
  )

  const locationBracket = useMemo(
    () => findLocationBracket(landUnitPrice),
    [landUnitPrice],
  )

  const needsLandPrice = landUnitPrice <= 0

  function handleApply() {
    if (!result) return
    onApply(result.buildingStandardValue)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 헤더 */}
        <div
          className="sticky top-0 z-10 text-white px-6 py-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles size={16} /> 건물기준시가 자동 계산
            </h2>
            <p className="text-xs opacity-90 mt-0.5">
              2025년 국세청 고시 기준 (주거용 일반건축물)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {needsLandPrice && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ 토지공시지가가 입력되지 않아 위치지수를 매핑할 수 없습니다. 메인 폼에서
              토지공시지가를 먼저 입력해주세요.
            </div>
          )}

          {/* 구조 + 용도 */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="구조" required>
              <select
                value={structureId}
                onChange={(e) => setStructureId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
              >
                {STRUCTURES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (지수 {s.index})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="용도" required>
              <select
                value={usageId}
                onChange={(e) => setUsageId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
              >
                {USAGES.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (지수 {u.index})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* 면적 + 신축연도 */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="건물면적 (㎡)"
              required
              hint="공용부 + 전유부 모두 포함"
            >
              <DecimalInput
                value={buildingArea}
                onChange={setBuildingArea}
                placeholder="예: 242.8263"
              />
            </Field>
            <Field
              label="신축연도"
              required
              hint={`평가기준연도 ${FISCAL_YEAR}년`}
            >
              <input
                type="number"
                min={1900}
                max={2100}
                value={builtYear || ''}
                onChange={(e) =>
                  setBuiltYear(Number(e.target.value) || FISCAL_YEAR)
                }
                placeholder={String(FISCAL_YEAR)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-right tabular-nums focus:border-indigo-500 focus:outline-none text-sm"
              />
            </Field>
          </div>

          {/* 위치지수 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">📍 위치지수 자동 매핑</p>
            <p>
              토지공시지가{' '}
              <strong className="tabular-nums">
                {landUnitPrice > 0
                  ? `${landUnitPrice.toLocaleString('ko-KR')}원/㎡`
                  : '미입력'}
              </strong>{' '}
              →{' '}
              {locationBracket ? (
                <>
                  구간 {locationBracket.no} (지수{' '}
                  <strong>{locationBracket.index}</strong>)
                </>
              ) : (
                '매핑 불가'
              )}
            </p>
          </div>

          {/* 결과 */}
          {result && (
            <section
              className="rounded-xl text-white p-5"
              style={{
                background:
                  'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              }}
            >
              <div className="text-xs opacity-80 mb-3">
                850,000 × {result.structure.index}{' '}
                <span className="opacity-60">(구조)</span>{' '}
                × {result.usage.index}{' '}
                <span className="opacity-60">(용도)</span>{' '}
                × {result.location.index}{' '}
                <span className="opacity-60">(위치)</span>{' '}
                × {result.residualRate.toFixed(3)}{' '}
                <span className="opacity-60">
                  (잔가율, 경과 {result.yearsElapsed}년 / 그룹{' '}
                  {result.depreciationGroup})
                </span>{' '}
                ÷ 100³
              </div>

              <div className="space-y-1.5">
                <ResultLine
                  label="㎡당 금액 (산출)"
                  value={`${result.perSqmRaw.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 원/㎡`}
                />
                <ResultLine
                  label="㎡당 금액 (1,000원 절사)"
                  value={`${result.perSqmRounded.toLocaleString('ko-KR')} 원/㎡`}
                />
                <ResultLine
                  label={`× 건물면적 ${result.totalArea} ㎡`}
                  value={formatWon(result.buildingStandardValue)}
                  emphasis
                />
              </div>
            </section>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!result}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <Check size={14} /> 계산 결과 적용
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

function ResultLine({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm ${emphasis ? 'font-bold' : 'opacity-90'}`}>
        {label}
      </span>
      <span
        className={`tabular-nums ${emphasis ? 'text-lg font-bold text-amber-200' : 'text-base font-medium'}`}
      >
        {value}
      </span>
    </div>
  )
}
