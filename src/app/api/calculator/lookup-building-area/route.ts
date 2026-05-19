import { NextResponse } from 'next/server'
import {
  getExposPubuseArea,
  getTitleInfo,
  probeExposApi,
  probeTitleApi,
} from '@/lib/api/building-cert/server'
import { buildDongHoApiParams } from '@/lib/utils/building-location'
import { generatePnuVariants, parsePnu, type PnuParts } from '@/lib/utils/pnu'

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
      structureRaw?: string
      structureId?: string
      usageId?: string
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

/**
 * 원본 PNU에서 전유공용 데이터가 0건이면 부번/대표지번/산여부 변형을 시도.
 * 매칭되는 PNU의 parts를 반환. 모두 실패하면 null.
 */
async function findWorkingPartsForExpos(
  originalPnu: string,
  originalParts: PnuParts,
): Promise<PnuParts | null> {
  const probe0 = await probeExposApi(originalParts)
  console.log('[lookup-building-area] pnu probe (expos)', {
    candidate: originalPnu,
    itemCount: probe0,
  })
  if (probe0 > 0) return originalParts

  const variants = generatePnuVariants(originalPnu).filter((v) => v !== originalPnu)
  for (const candidate of variants) {
    const cParts = parsePnu(candidate)
    if (!cParts) continue
    const count = await probeExposApi(cParts)
    console.log('[lookup-building-area] pnu probe (expos)', {
      candidate,
      itemCount: count,
    })
    if (count > 0) {
      console.log('[lookup-building-area] pnu adjusted (expos)', {
        original: originalPnu,
        matched: candidate,
      })
      return cParts
    }
  }
  return null
}

async function findWorkingPartsForTitle(
  originalPnu: string,
  originalParts: PnuParts,
): Promise<PnuParts | null> {
  const probe0 = await probeTitleApi(originalParts)
  console.log('[lookup-building-area] pnu probe (title)', {
    candidate: originalPnu,
    itemCount: probe0,
  })
  if (probe0 > 0) return originalParts

  const variants = generatePnuVariants(originalPnu).filter((v) => v !== originalPnu)
  for (const candidate of variants) {
    const cParts = parsePnu(candidate)
    if (!cParts) continue
    const count = await probeTitleApi(cParts)
    console.log('[lookup-building-area] pnu probe (title)', {
      candidate,
      itemCount: count,
    })
    if (count > 0) {
      console.log('[lookup-building-area] pnu adjusted (title)', {
        original: originalPnu,
        matched: candidate,
      })
      return cParts
    }
  }
  return null
}

export async function POST(
  req: Request,
): Promise<NextResponse<LookupBuildingAreaResponse>> {
  const ua = req.headers.get('user-agent') ?? ''
  try {
    const body = (await req.json()) as LookupBuildingAreaRequest
    console.log('[lookup-building-area] request', {
      pnu: body.pnu,
      dongInput: body.dongInput,
      hoInput: body.hoInput,
      isBasement: body.isBasement,
      ua: ua.slice(0, 120),
    })

    if (!body.pnu) {
      return NextResponse.json({ ok: false, reason: 'NO_PNU' })
    }
    const parts = parsePnu(body.pnu)
    if (!parts) {
      console.warn('[lookup-building-area] invalid pnu', body.pnu)
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
      // PNU probe: VWorld가 잘못된 부번을 골랐을 가능성 대비 (PR #110).
      // 원본 PNU에서 0건이면 인접 부번/대표지번/산여부 변형을 시도.
      const workingParts = await findWorkingPartsForExpos(body.pnu, parts)
      if (!workingParts) {
        const label = `${apiParams.dongNm ? `${apiParams.dongNm}동 ` : ''}${apiParams.hoNm}`
        return NextResponse.json({
          ok: false,
          reason: 'EXPOS_PUBUSE_NOT_FOUND',
          message: `${label}의 데이터를 찾지 못했습니다. PNU 변형 시도 모두 실패 — 정부 데이터에 누락되었거나 다른 필지일 수 있습니다. [PDF 업로드] 사용을 권장합니다.`,
        })
      }

      const result = await getExposPubuseArea(
        workingParts,
        apiParams.dongNm,
        apiParams.hoNm,
      )
      if (result) {
        // 준공연도/구조/용도 메타데이터는 표제부에서 — 부가 호출 1회.
        // 사용자 입력 dong과 매칭되는 동의 정보를 받음 (105동 vs 211동 등).
        const titleForMeta = await getTitleInfo(workingParts, body.dongInput ?? '')
        return NextResponse.json({
          ok: true,
          totalArea: result.totalArea,
          mode: 'exposPubuse',
          exposArea: result.exposArea,
          pubuseArea: result.pubuseArea,
          dongNm: result.dongNm,
          hoNm: result.hoNm,
          completionYear: titleForMeta?.completionYear,
          structureRaw: titleForMeta?.structureRaw,
          structureId: titleForMeta?.structureId,
          usageId: titleForMeta?.usageId,
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
    // 같은 PNU 변형 폴백 적용 (PR #110)
    const titleParts = await findWorkingPartsForTitle(body.pnu, parts)
    if (!titleParts) {
      return NextResponse.json({ ok: false, reason: 'NO_DATA' })
    }
    const titleResult = await getTitleInfo(titleParts)
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
      structureRaw: titleResult.structureRaw,
      structureId: titleResult.structureId,
      usageId: titleResult.usageId,
    })
  } catch (e) {
    console.error('[lookup-building-area] error', e)
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
