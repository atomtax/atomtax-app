/**
 * PNU(필지 고유번호 19자리) 파싱 + 건축물대장 API 파라미터 매핑.
 *
 * 구조: [시군구코드 5][법정동코드 5][산여부 1][본번 4][부번 4]
 * 예: "1121510700100500002" → 광진구 화양동 50-2
 *      11215  10700  1  0050  0002
 *
 * PNU 산여부 → API platGbCd 매핑:
 *  - "1" (일반/대지) → "0"
 *  - "2" (산)        → "1"
 */

export interface PnuParts {
  /** 5자리 시군구코드 (예: "11215") */
  sigunguCd: string
  /** 5자리 법정동코드 */
  bjdongCd: string
  /** 1자리 대지구분 ("0"=대지, "1"=산) */
  platGbCd: string
  /** 4자리 본번 */
  bun: string
  /** 4자리 부번 */
  ji: string
}

export function parsePnu(pnu: string): PnuParts | null {
  if (!pnu) return null
  if (pnu.length !== 19) return null
  if (!/^\d{19}$/.test(pnu)) return null

  const sigunguCd = pnu.slice(0, 5)
  const bjdongCd = pnu.slice(5, 10)
  const sanYn = pnu.slice(10, 11)
  const bun = pnu.slice(11, 15)
  const ji = pnu.slice(15, 19)

  let platGbCd = '0'
  if (sanYn === '2') platGbCd = '1'

  return { sigunguCd, bjdongCd, platGbCd, bun, ji }
}

/**
 * PNU 부번 변형 시도 목록 — VWorld가 잘못된 부번을 골랐을 때 폴백 (PR #110).
 *
 * 흔한 케이스: "109-1 외 1필지" 같이 여러 필지에 걸친 단지에서 VWorld는 109-2를
 * 매핑하지만 건축물대장은 대표지번 109-1에만 등록 → API 0건.
 *
 * 시도 순서:
 *   1. 원본
 *   2. 부번 -1, +1 (가장 흔한 케이스)
 *   3. 부번 -2, +2
 *   4. 부번 0000 (대표지번만 등록된 경우)
 *   5. 산여부 반대 (1↔2)
 *
 * 19자리 형식 유지. 중복 제거.
 */
export function generatePnuVariants(pnu: string): string[] {
  if (pnu.length !== 19 || !/^\d{19}$/.test(pnu)) return [pnu]

  const prefix = pnu.slice(0, 10) // 시군구5+법정동5
  const sanYn = pnu.slice(10, 11)
  const bun = pnu.slice(11, 15)
  const jiNum = parseInt(pnu.slice(15, 19), 10)

  const variants = new Set<string>([pnu])

  // 부번 인접값 (-1, +1, -2, +2)
  for (const offset of [-1, 1, -2, 2]) {
    const newJi = jiNum + offset
    if (newJi >= 0 && newJi <= 9999) {
      variants.add(`${prefix}${sanYn}${bun}${String(newJi).padStart(4, '0')}`)
    }
  }

  // 대표지번 (부번 0000)
  if (jiNum !== 0) {
    variants.add(`${prefix}${sanYn}${bun}0000`)
  }

  // 산여부 반대 (대지 ↔ 산)
  const altSanYn = sanYn === '1' ? '2' : '1'
  variants.add(`${prefix}${altSanYn}${bun}${pnu.slice(15, 19)}`)

  return Array.from(variants)
}
