/**
 * 조세특례제한법 §6 창업중소기업 등에 대한 세액감면
 *
 * 사용자(세무사) 도메인 기준 단순화된 OR 분기 (PR #91):
 *   - 비과밀억제권역 AND 청년(만 34세 이하) → 100%
 *   - 비과밀억제권역 OR  청년                → 50%
 *   - 둘 다 X (과밀억제 + 일반)              → X (감면 없음)
 *
 * 권역 분류 (regional-zones.ts):
 *   - overcrowded           : 과밀억제권역
 *   - metro_non_overcrowded : 수도권 비과밀
 *   - non_metro             : 비수도권
 *   → metro_non_overcrowded와 non_metro는 모두 "비과밀억제권역"으로 간주
 */

import type { RegionZone } from '@/lib/data/regional-zones'

export interface ReductionInput {
  zone: RegionZone
  isYoung: boolean
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
  const { zone, isYoung } = input
  const isNonOvercrowded = zone !== 'overcrowded'

  if (isNonOvercrowded && isYoung) {
    return {
      rate: 100,
      rateLabel: '100%',
      conditions: { isYoung: true, isNonOvercrowded: true },
      appliedRule: '비과밀억제권역 + 청년(만 34세 이하) — 100%',
    }
  }

  if (isNonOvercrowded || isYoung) {
    return {
      rate: 50,
      rateLabel: '50%',
      conditions: { isYoung, isNonOvercrowded },
      appliedRule: isNonOvercrowded
        ? '비과밀억제권역 — 50%'
        : '청년(만 34세 이하) — 50%',
    }
  }

  return {
    rate: 0,
    rateLabel: 'X',
    conditions: { isYoung: false, isNonOvercrowded: false },
    appliedRule: '과밀억제권역 + 일반 — 창업감면 X',
  }
}

/**
 * 만 34세 이하 여부 (개업당시 기준)
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

  // 만 34세 이하 (= age <= 34, 즉 만 35세 미만과 결과 동치)
  return age <= 34
}
