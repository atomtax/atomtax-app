/**
 * 조세특례제한법 §6 창업중소기업 등에 대한 세액감면
 *
 * 권역 × 청년여부 × 개업연도에 따른 감면율 계산.
 *
 * 감면율 매트릭스:
 *   - 비수도권 + 청년 (만 35세 미만)           : 100%
 *   - 비수도권 + 일반                           : 50%
 *   - 수도권 비과밀 + 청년 (2025년 이전)        : 50%
 *   - 수도권 비과밀 + 청년 (2026년 이후)        : 75%  ⭐ 분기
 *   - 수도권 비과밀 + 일반                      : 25%
 *   - 과밀억제권역                              : 0% (감면 없음)
 *
 * 2026년부터 수도권 비과밀이 청년 75 / 일반 25로 명문 분리.
 */

import type { RegionZone } from '@/lib/data/regional-zones'

export interface ReductionInput {
  zone: RegionZone
  isYoung: boolean
  openingYear: number
}

export interface ReductionResult {
  rate: number
  rateLabel: string
  conditions: {
    isYoung: boolean
    isNonOvercrowded: boolean
  }
  appliedRule: string
}

/**
 * 창업감면율 계산 (조특법 §6)
 */
export function calculateStartupReductionRate(input: ReductionInput): ReductionResult {
  const { zone, isYoung, openingYear } = input

  // 1. 과밀억제권역 — 창업감면 대상 아님
  if (zone === 'overcrowded') {
    return {
      rate: 0,
      rateLabel: 'X',
      conditions: { isYoung, isNonOvercrowded: false },
      appliedRule: '과밀억제권역 — 창업감면 X',
    }
  }

  // 2. 비수도권 — 가장 큰 감면
  if (zone === 'non_metro') {
    if (isYoung) {
      return {
        rate: 100,
        rateLabel: '100',
        conditions: { isYoung: true, isNonOvercrowded: true },
        appliedRule: '비수도권 + 청년 — 100%',
      }
    }
    return {
      rate: 50,
      rateLabel: '50',
      conditions: { isYoung: false, isNonOvercrowded: true },
      appliedRule: '비수도권 + 일반 — 50%',
    }
  }

  // 3. 수도권 비과밀 — 2026년 분기
  if (openingYear >= 2026) {
    if (isYoung) {
      return {
        rate: 75,
        rateLabel: '75',
        conditions: { isYoung: true, isNonOvercrowded: true },
        appliedRule: '2026년~ 수도권 비과밀 + 청년 — 75%',
      }
    }
    return {
      rate: 25,
      rateLabel: '25',
      conditions: { isYoung: false, isNonOvercrowded: true },
      appliedRule: '2026년~ 수도권 비과밀 + 일반 — 25%',
    }
  }

  // 2025년 이전 수도권 비과밀
  if (isYoung) {
    return {
      rate: 50,
      rateLabel: '50',
      conditions: { isYoung: true, isNonOvercrowded: true },
      appliedRule: '~2025년 수도권 비과밀 + 청년 — 50%',
    }
  }
  return {
    rate: 25,
    rateLabel: '25',
    conditions: { isYoung: false, isNonOvercrowded: true },
    appliedRule: '~2025년 수도권 비과밀 + 일반 — 25%',
  }
}

/**
 * 만 35세 미만 여부 (개업당시 기준)
 *
 * - 주민번호 앞 6자리(YYMMDD)로 생년월일 추출
 * - 7번째 자리로 세기 추정 (1·2 = 1900년대, 3·4 = 2000년대)
 * - 7번째 자리 없으면 yy >= 30 → 1900년대, < 30 → 2000년대 (외국인/구형 데이터 대비)
 * - 생일 안 지났으면 만 나이 -1
 *
 * 민감정보(주민번호) 자체는 반환하지 않고 boolean만 노출.
 */
export function isYoungAtOpening(
  residentNumber: string | null | undefined,
  openingDate: string | null | undefined,
): boolean {
  if (!residentNumber || !openingDate) return false

  const digits = residentNumber.replace(/-/g, '')
  const yymmdd = digits.slice(0, 6)
  if (!/^\d{6}$/.test(yymmdd)) return false

  const yy = parseInt(yymmdd.slice(0, 2), 10)
  const mm = parseInt(yymmdd.slice(2, 4), 10)
  const dd = parseInt(yymmdd.slice(4, 6), 10)

  const seventhDigit = digits.charAt(6)
  let birthYear: number
  if (seventhDigit === '1' || seventhDigit === '2') birthYear = 1900 + yy
  else if (seventhDigit === '3' || seventhDigit === '4') birthYear = 2000 + yy
  else birthYear = yy >= 30 ? 1900 + yy : 2000 + yy

  const birthDate = new Date(birthYear, mm - 1, dd)
  const openDate = new Date(openingDate)
  if (Number.isNaN(openDate.getTime())) return false

  let age = openDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = openDate.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && openDate.getDate() < birthDate.getDate())) {
    age--
  }

  return age < 35
}
