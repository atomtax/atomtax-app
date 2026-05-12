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
