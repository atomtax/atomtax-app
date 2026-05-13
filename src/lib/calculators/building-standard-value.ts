/**
 * 2025년 건물 기준시가 산식 구현.
 * 데이터는 building-standard-data.ts 참조.
 *
 * 산식:
 *   ㎡당 금액 = 850,000 × 구조지수 × 용도지수 × 위치지수 × 잔가율 ÷ 100³
 *   ㎡당 금액(절사) = floor(㎡당 금액 / 1000) × 1000      (1,000원 미만 절사)
 *   기준시가 = ㎡당 금액(절사) × 건물면적
 *
 * 잔가율:
 *   max(1 - annualRate × 경과연수, minResidualRate=0.10)
 *   경과연수 = 평가기준연도(2025) - 신축연도, 최소 0
 */

import {
  BASE_VALUE_PER_SQM,
  DEPRECIATION_GROUPS,
  LOCATION_INDEX,
  STRUCTURES,
  USAGES,
  type DepreciationGroup,
  type LocationBracket,
  type StructureOption,
  type UsageOption,
} from './building-standard-data'

export interface BuildingStandardValueInput {
  /** 구조 id (STRUCTURES) */
  structureId: string
  /** 용도 id (USAGES) */
  usageId: string
  /** 토지공시지가 (원/㎡) — 위치지수 자동 매핑에 사용 */
  landUnitPrice: number
  /** 건물면적 (㎡) */
  buildingArea: number
  /** 신축연도 (예: 2015) */
  builtYear: number
  /** 평가기준연도. 기본 2025 */
  fiscalYear?: number
}

export interface BuildingStandardValueResult {
  baseValue: number
  structure: StructureOption
  usage: UsageOption
  location: LocationBracket
  depreciationGroup: DepreciationGroup
  yearsElapsed: number
  residualRate: number
  perSqmRaw: number
  perSqmRounded: number
  totalArea: number
  buildingStandardValue: number
}

/** 토지공시지가 → 위치지수 매핑 */
export function findLocationBracket(landUnitPrice: number): LocationBracket | null {
  if (!Number.isFinite(landUnitPrice) || landUnitPrice < 0) return null
  for (const b of LOCATION_INDEX) {
    const inRange =
      landUnitPrice >= b.min && (b.max === null || landUnitPrice < b.max)
    if (inRange) return b
  }
  // 마지막 구간(상한 없음)
  return LOCATION_INDEX[LOCATION_INDEX.length - 1] ?? null
}

/** 잔가율 계산 */
export function calculateResidualRate(
  group: DepreciationGroup,
  builtYear: number,
  fiscalYear: number = new Date().getFullYear(),
): { yearsElapsed: number; residualRate: number } {
  const info = DEPRECIATION_GROUPS[group]
  const yearsElapsed = Math.max(0, fiscalYear - builtYear)
  const computed = 1 - info.annualRate * yearsElapsed
  const residualRate = Math.max(info.minResidualRate, computed)
  return { yearsElapsed, residualRate }
}

/** 건물 기준시가 계산 (산식 메인 함수) */
export function calculateBuildingStandardValue(
  input: BuildingStandardValueInput,
): BuildingStandardValueResult | null {
  const {
    structureId,
    usageId,
    landUnitPrice,
    buildingArea,
    builtYear,
    fiscalYear = new Date().getFullYear(),
  } = input

  const structure = STRUCTURES.find((s) => s.id === structureId)
  const usage = USAGES.find((u) => u.id === usageId)
  const location = findLocationBracket(landUnitPrice)

  if (!structure || !usage || !location) return null
  if (!Number.isFinite(buildingArea) || buildingArea <= 0) return null
  if (!Number.isFinite(builtYear) || builtYear < 1900 || builtYear > 9999) {
    return null
  }

  const { yearsElapsed, residualRate } = calculateResidualRate(
    structure.depreciationGroup,
    builtYear,
    fiscalYear,
  )

  // 850,000 × 구조 × 용도 × 위치 × 잔가율 / 100³
  const perSqmRaw =
    (BASE_VALUE_PER_SQM *
      structure.index *
      usage.index *
      location.index *
      residualRate) /
    1_000_000
  const perSqmRounded = Math.floor(perSqmRaw / 1000) * 1000
  const buildingStandardValue = perSqmRounded * buildingArea

  return {
    baseValue: BASE_VALUE_PER_SQM,
    structure,
    usage,
    location,
    depreciationGroup: structure.depreciationGroup,
    yearsElapsed,
    residualRate,
    perSqmRaw,
    perSqmRounded,
    totalArea: buildingArea,
    buildingStandardValue,
  }
}
