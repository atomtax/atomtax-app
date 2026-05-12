/**
 * 건축물대장 PDF → 면적 자동 추출.
 * - 집합건물(아파트/다세대): 전유면적 + 공용면적 합산
 * - 일반건물(단독/다가구): 연면적 그대로
 * pdf-parse v2 (PDFParse 클래스 기반) 사용.
 */

import { PDFParse } from 'pdf-parse'

export type BuildingType = 'collective' | 'general' | 'unknown'

export interface BuildingCertParseResult {
  /** 합산 총면적 (㎡) — UI에 자동 입력될 값 */
  totalArea: number
  /** 전유면적 (집합건물) */
  exclusiveArea?: number
  /** 공용면적 (집합건물) */
  commonArea?: number
  /** 연면적 (일반건물) */
  totalFloorArea?: number
  buildingType: BuildingType
  /** 디버그용 (응답에 포함하지 않음) */
  rawTextSnippet?: string
}

function parseAreaNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim()
  const n = parseFloat(cleaned)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export async function parseBuildingCertificate(
  buffer: Buffer,
): Promise<BuildingCertParseResult | null> {
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    await parser.destroy()

    const text = result.text ?? ''
    if (!text) return null

    // 1. 집합건물: "전유부 면적" + "공용부 면적" 시도
    //    한글 띄어쓰기/줄바꿈 변형 허용
    const exclusiveMatch = text.match(
      /전\s*유\s*부?\s*(?:의\s*)?면\s*적[^\d]*([\d,.]+)\s*(?:㎡|m2|제곱미터)?/,
    )
    const commonMatch = text.match(
      /공\s*용\s*부?\s*(?:의\s*)?면\s*적[^\d]*([\d,.]+)\s*(?:㎡|m2|제곱미터)?/,
    )

    if (exclusiveMatch && commonMatch) {
      const exclusiveArea = parseAreaNumber(exclusiveMatch[1])
      const commonArea = parseAreaNumber(commonMatch[1])
      if (exclusiveArea > 0 && commonArea > 0) {
        return {
          totalArea: exclusiveArea + commonArea,
          exclusiveArea,
          commonArea,
          buildingType: 'collective',
          rawTextSnippet: text.slice(0, 500),
        }
      }
    }

    // 2. 일반건물: "연면적" 시도
    const totalFloorMatch = text.match(
      /연\s*면\s*적[^\d]*([\d,.]+)\s*(?:㎡|m2|제곱미터)?/,
    )
    if (totalFloorMatch) {
      const totalFloorArea = parseAreaNumber(totalFloorMatch[1])
      if (totalFloorArea > 0) {
        return {
          totalArea: totalFloorArea,
          totalFloorArea,
          buildingType: 'general',
          rawTextSnippet: text.slice(0, 500),
        }
      }
    }

    return null
  } catch (e) {
    console.error('[pdf-parser] failed', e)
    return null
  }
}
