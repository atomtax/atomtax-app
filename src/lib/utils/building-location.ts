/**
 * 사용자의 "상세 위치" 입력에서 동/호 추출.
 * 추출 실패 시 null (집합건물 아닌 것으로 간주).
 *
 * 지원 형식:
 *  - "101동 801호", "302동 407호"
 *  - "B동 1502호" (영문 동)
 *  - "302-407", "302 407"
 *  - "407호" (동 단일인 경우)
 */

export interface DongHo {
  dongNm: string
  hoNm: string
}

export function parseDongHo(input: string | null | undefined): DongHo | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // 패턴 1: "302동 407호", "B동 1502호"
  const p1 = /^([\w가-힣]+)\s*동\s+([\w가-힣]+)\s*호?\s*$/i
  const m1 = trimmed.match(p1)
  if (m1) {
    const ho = m1[2].endsWith('호') ? m1[2] : `${m1[2]}호`
    return { dongNm: m1[1], hoNm: ho }
  }

  // 패턴 2: "302-407", "302,407"
  const p2 = /^([\w가-힣]+)[-,\s]+([\w가-힣]+)호?\s*$/i
  const m2 = trimmed.match(p2)
  if (m2) {
    const ho = m2[2].endsWith('호') ? m2[2] : `${m2[2]}호`
    return { dongNm: m2[1], hoNm: ho }
  }

  // 패턴 3: "407호" 또는 "407"만
  const p3 = /^(\d+)\s*호?\s*$/
  const m3 = trimmed.match(p3)
  if (m3) {
    return { dongNm: '', hoNm: `${m3[1]}호` }
  }

  return null
}
