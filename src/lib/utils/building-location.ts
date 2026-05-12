/**
 * 사용자의 동/호/지하 입력 → 건축물대장 API 파라미터 변환.
 *
 * 변환 규칙:
 *  - hoInput="407", isBasement=false → hoNm="407호"
 *  - hoInput="407", isBasement=true  → hoNm="B407호"
 *  - hoInput=""                       → hoNm="" (조회 안 됨)
 *  - dongInput="302"                  → dongNm="302"
 *
 * 동/호 모두 비어있으면 null (단독주택 케이스, 표제부 조회 모드).
 */

export interface DongHoInput {
  dongInput: string
  hoInput: string
  isBasement: boolean
}

export interface DongHoApiParams {
  dongNm: string
  hoNm: string
}

export function buildDongHoApiParams(
  input: DongHoInput,
): DongHoApiParams | null {
  const dong = input.dongInput.trim()
  const ho = input.hoInput.trim()

  if (!dong && !ho) return null

  let hoNm = ''
  if (ho) {
    const prefix = input.isBasement ? 'B' : ''
    const suffix = ho.endsWith('호') ? '' : '호'
    hoNm = `${prefix}${ho}${suffix}`
  }

  return { dongNm: dong, hoNm }
}
