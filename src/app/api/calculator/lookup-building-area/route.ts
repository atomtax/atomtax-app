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
    }
  | {
      ok: false
      reason:
        | 'NO_PNU'
        | 'INVALID_PNU'
        | 'NO_DATA'
        | 'NO_DONG_HO_FOR_COLLECTIVE'
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

    // 동/호 있으면 전유공용면적 조회 우선
    if (apiParams) {
      const result = await getExposPubuseArea(
        parts,
        apiParams.dongNm,
        apiParams.hoNm,
      )
      if (result) {
        return NextResponse.json({
          ok: true,
          totalArea: result.totalArea,
          mode: 'exposPubuse',
          exposArea: result.exposArea,
          pubuseArea: result.pubuseArea,
          dongNm: result.dongNm,
          hoNm: result.hoNm,
        })
      }
      // 폴백: 표제부 시도
    }

    const titleResult = await getTitleInfo(parts)
    if (!titleResult) {
      return NextResponse.json({ ok: false, reason: 'NO_DATA' })
    }

    if (titleResult.isCollective && !apiParams) {
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
    })
  } catch (e) {
    console.error('[lookup-building-area] error', e)
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
