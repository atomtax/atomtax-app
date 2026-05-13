import { NextResponse } from 'next/server'
import {
  getExposPubuseArea,
  getTitleInfo,
} from '@/lib/api/building-cert/server'
import { buildDongHoApiParams } from '@/lib/utils/building-location'
import { parsePnu } from '@/lib/utils/pnu'

export const runtime = 'nodejs'

export interface LookupBuildingAreaRequest {
  pnu: string
  dongInput?: string
  hoInput?: string
  isBasement?: boolean
}

export type LookupBuildingAreaResponse =
  | {
      ok: true
      totalArea: number
      mode: 'title' | 'exposPubuse'
      buildingType?: string
      buildingName?: string
      isCollective?: boolean
      exposArea?: number
      pubuseArea?: number
      dongNm?: string
      hoNm?: string
      completionYear?: number
      structure?: string
    }
  | {
      ok: false
      reason:
        | 'NO_PNU'
        | 'INVALID_PNU'
        | 'NO_DATA'
        | 'NO_DONG_HO_FOR_COLLECTIVE'
        | 'EXPOS_PUBUSE_NOT_FOUND'
        | 'INTERNAL_ERROR'
      message?: string
    }

export async function POST(
  req: Request,
): Promise<NextResponse<LookupBuildingAreaResponse>> {
  try {
    const body = (await req.json()) as LookupBuildingAreaRequest

    if (!body.pnu) {
      return NextResponse.json({ ok: false, reason: 'NO_PNU' })
    }
    const parts = parsePnu(body.pnu)
    if (!parts) {
      return NextResponse.json({ ok: false, reason: 'INVALID_PNU' })
    }

    const apiParams = buildDongHoApiParams({
      dongInput: body.dongInput ?? '',
      hoInput: body.hoInput ?? '',
      isBasement: body.isBasement ?? false,
    })

    // 동/호 입력 시 → 전유공용면적만 시도 (표제부 폴백 금지)
    // 표제부로 폴백하면 단지 전체 연면적이 반환되어 사용자에게 잘못된 값 전달.
    if (apiParams) {
      const result = await getExposPubuseArea(
        parts,
        apiParams.dongNm,
        apiParams.hoNm,
      )
      if (result) {
        // 준공연도/구조 메타데이터는 표제부에서 — 부가 호출 1회.
        const titleForMeta = await getTitleInfo(parts)
        return NextResponse.json({
          ok: true,
          totalArea: result.totalArea,
          mode: 'exposPubuse',
          exposArea: result.exposArea,
          pubuseArea: result.pubuseArea,
          dongNm: result.dongNm,
          hoNm: result.hoNm,
          completionYear: titleForMeta?.completionYear,
          structure: titleForMeta?.structure,
          buildingType: titleForMeta?.buildingType,
          buildingName: titleForMeta?.buildingName,
        })
      }
      const label = `${apiParams.dongNm ? `${apiParams.dongNm}동 ` : ''}${apiParams.hoNm}`
      return NextResponse.json({
        ok: false,
        reason: 'EXPOS_PUBUSE_NOT_FOUND',
        message: `${label}의 데이터를 찾지 못했습니다. 일부 단지는 건축물대장 API 형식 차이로 자동 조회가 안 되니 직접 입력하거나 PDF 업로드를 사용하세요.`,
      })
    }

    // 동/호 미입력 (단독주택 케이스) → 표제부 조회
    const titleResult = await getTitleInfo(parts)
    if (!titleResult) {
      return NextResponse.json({ ok: false, reason: 'NO_DATA' })
    }

    if (titleResult.isCollective) {
      return NextResponse.json({
        ok: false,
        reason: 'NO_DONG_HO_FOR_COLLECTIVE',
        message:
          '집합건물(아파트/다세대)입니다. 동/호를 입력하고 다시 조회해주세요.',
      })
    }

    return NextResponse.json({
      ok: true,
      totalArea: titleResult.totalArea,
      mode: 'title',
      buildingType: titleResult.buildingType,
      buildingName: titleResult.buildingName,
      isCollective: titleResult.isCollective,
      completionYear: titleResult.completionYear,
      structure: titleResult.structure,
    })
  } catch (e) {
    console.error('[lookup-building-area] error', e)
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
