/**
 * 2025년 건물 기준시가 계산방법 데이터 (국세청 고시 제2024-38호, 2025.1.1. 시행).
 * 주거용 일반건축물 (아파트, 단독주택, 다가구, 연립, 다세대, 도시형생활주택 등).
 *
 * 산식: 기준시가 = (㎡당 금액) × 건물면적
 *       ㎡당 금액 = 850,000 × 구조지수 × 용도지수 × 위치지수 × 잔가율 ÷ 100³
 *       (1,000원 단위 미만 절사)
 */

export const BASE_VALUE_PER_SQM = 850_000

export type DepreciationGroup = 'I' | 'II' | 'III' | 'IV'

export interface StructureOption {
  id: string
  name: string
  index: number
  depreciationGroup: DepreciationGroup
}

export const STRUCTURES: readonly StructureOption[] = [
  { id: 'tongnamu', name: '통나무조', index: 135, depreciationGroup: 'I' },
  { id: 'mokgu', name: '목구조', index: 120, depreciationGroup: 'I' },
  { id: 'cheolgolcheolgeun', name: '철골(철골철근)콘크리트조 (SRC)', index: 110, depreciationGroup: 'I' },
  { id: 'cheolgeun', name: '철근콘크리트조 (RC)', index: 100, depreciationGroup: 'I' },
  { id: 'seokjo', name: '석조', index: 100, depreciationGroup: 'I' },
  { id: 'precast', name: '프리캐스트 콘크리트조 (PC)', index: 100, depreciationGroup: 'I' },
  { id: 'rahmen', name: '라멘조', index: 100, depreciationGroup: 'I' },
  { id: 'moko', name: '목조', index: 100, depreciationGroup: 'II' },
  { id: 'alc', name: 'ALC조', index: 100, depreciationGroup: 'II' },
  { id: 'steelhouse', name: '스틸하우스조', index: 100, depreciationGroup: 'II' },
  { id: 'yeonwa', name: '연와조', index: 95, depreciationGroup: 'II' },
  { id: 'cheolgol', name: '철골조', index: 95, depreciationGroup: 'II' },
  { id: 'bogangconcrete', name: '보강콘크리트조', index: 95, depreciationGroup: 'II' },
  { id: 'bogangblock', name: '보강블록조', index: 95, depreciationGroup: 'II' },
  { id: 'cementbrick', name: '시멘트벽돌조', index: 90, depreciationGroup: 'II' },
  { id: 'hwangto', name: '황토조', index: 90, depreciationGroup: 'III' },
  { id: 'cementblock', name: '시멘트블록조', index: 90, depreciationGroup: 'III' },
  { id: 'wirepanel', name: '와이어패널조', index: 90, depreciationGroup: 'II' },
  { id: 'eps_panel', name: '철골조 중 조립식패널(EPS패널)', index: 85, depreciationGroup: 'II' },
  { id: 'joriphsik', name: '조립식패널조', index: 80, depreciationGroup: 'III' },
  { id: 'kyungryang', name: '경량철골조', index: 79, depreciationGroup: 'III' },
  { id: 'seokhwe_etc', name: '석회/흙벽돌조, 돌담/토담조', index: 60, depreciationGroup: 'III' },
  { id: 'cheolpipe', name: '철파이프조', index: 59, depreciationGroup: 'IV' },
  { id: 'container', name: '컨테이너건물', index: 59, depreciationGroup: 'IV' },
] as const

export interface UsageOption {
  id: string
  name: string
  index: number
  description: string
}

export const USAGES: readonly UsageOption[] = [
  {
    id: 'apartment',
    name: '아파트',
    index: 110,
    description: '공동주택 중 아파트 (5층 이상)',
  },
  {
    id: 'residential_other',
    name: '기타 주거용 건물',
    index: 100,
    description:
      '단독주택, 다중주택, 다가구주택, 연립주택, 다세대주택, 기숙사, 도시형 생활주택 등',
  },
] as const

export interface LocationBracket {
  no: number
  /** 토지공시지가 (원/㎡) 하한 — 포함 */
  min: number
  /** 토지공시지가 (원/㎡) 상한 — 미만, null이면 상한 없음 */
  max: number | null
  index: number
}

export const LOCATION_INDEX: readonly LocationBracket[] = [
  { no: 1, min: 0, max: 20_000, index: 78 },
  { no: 2, min: 20_000, max: 30_000, index: 83 },
  { no: 3, min: 30_000, max: 50_000, index: 85 },
  { no: 4, min: 50_000, max: 70_000, index: 86 },
  { no: 5, min: 70_000, max: 100_000, index: 87 },
  { no: 6, min: 100_000, max: 130_000, index: 88 },
  { no: 7, min: 130_000, max: 150_000, index: 89 },
  { no: 8, min: 150_000, max: 180_000, index: 90 },
  { no: 9, min: 180_000, max: 200_000, index: 91 },
  { no: 10, min: 200_000, max: 300_000, index: 92 },
  { no: 11, min: 300_000, max: 350_000, index: 93 },
  { no: 12, min: 350_000, max: 500_000, index: 94 },
  { no: 13, min: 500_000, max: 650_000, index: 97 },
  { no: 14, min: 650_000, max: 800_000, index: 100 },
  { no: 15, min: 800_000, max: 1_000_000, index: 102 },
  { no: 16, min: 1_000_000, max: 1_200_000, index: 105 },
  { no: 17, min: 1_200_000, max: 1_600_000, index: 108 },
  { no: 18, min: 1_600_000, max: 2_000_000, index: 111 },
  { no: 19, min: 2_000_000, max: 2_500_000, index: 114 },
  { no: 20, min: 2_500_000, max: 3_000_000, index: 116 },
  { no: 21, min: 3_000_000, max: 3_500_000, index: 118 },
  { no: 22, min: 3_500_000, max: 4_000_000, index: 120 },
  { no: 23, min: 4_000_000, max: 4_500_000, index: 122 },
  { no: 24, min: 4_500_000, max: 5_000_000, index: 124 },
  { no: 25, min: 5_000_000, max: 5_500_000, index: 126 },
  { no: 26, min: 5_500_000, max: 6_000_000, index: 128 },
  { no: 27, min: 6_000_000, max: 7_000_000, index: 130 },
  { no: 28, min: 7_000_000, max: 8_000_000, index: 132 },
  { no: 29, min: 8_000_000, max: 9_000_000, index: 134 },
  { no: 30, min: 9_000_000, max: 10_000_000, index: 137 },
  { no: 31, min: 10_000_000, max: 15_000_000, index: 140 },
  { no: 32, min: 15_000_000, max: 20_000_000, index: 143 },
  { no: 33, min: 20_000_000, max: 25_000_000, index: 146 },
  { no: 34, min: 25_000_000, max: 30_000_000, index: 149 },
  { no: 35, min: 30_000_000, max: 35_000_000, index: 152 },
  { no: 36, min: 35_000_000, max: 40_000_000, index: 155 },
  { no: 37, min: 40_000_000, max: 45_000_000, index: 158 },
  { no: 38, min: 45_000_000, max: 50_000_000, index: 161 },
  { no: 39, min: 50_000_000, max: 55_000_000, index: 164 },
  { no: 40, min: 55_000_000, max: 60_000_000, index: 167 },
  { no: 41, min: 60_000_000, max: 65_000_000, index: 170 },
  { no: 42, min: 65_000_000, max: 70_000_000, index: 173 },
  { no: 43, min: 70_000_000, max: 75_000_000, index: 176 },
  { no: 44, min: 75_000_000, max: 80_000_000, index: 179 },
  { no: 45, min: 80_000_000, max: null, index: 182 },
] as const

export interface DepreciationGroupInfo {
  usefulLifeYears: number
  /** 연 감가율 */
  annualRate: number
  /** 최저 잔가율 (10%) */
  minResidualRate: number
}

export const DEPRECIATION_GROUPS: Record<DepreciationGroup, DepreciationGroupInfo> = {
  I: { usefulLifeYears: 50, annualRate: 0.018, minResidualRate: 0.1 },
  II: { usefulLifeYears: 40, annualRate: 0.0225, minResidualRate: 0.1 },
  III: { usefulLifeYears: 30, annualRate: 0.03, minResidualRate: 0.1 },
  IV: { usefulLifeYears: 20, annualRate: 0.045, minResidualRate: 0.1 },
}

export const FISCAL_YEAR = 2025
