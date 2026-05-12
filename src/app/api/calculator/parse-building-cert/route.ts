import { NextResponse } from 'next/server'
import { parseBuildingCertificate } from '@/lib/parsers/building-certificate-parser'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type ParseBuildingCertResponse =
  | {
      ok: true
      totalArea: number
      exclusiveArea?: number
      commonArea?: number
      totalFloorArea?: number
      buildingType: 'collective' | 'general' | 'unknown'
    }
  | {
      ok: false
      reason: 'NO_FILE' | 'NOT_PDF' | 'TOO_LARGE' | 'PARSE_FAILED' | 'INTERNAL_ERROR'
    }

export async function POST(
  req: Request,
): Promise<NextResponse<ParseBuildingCertResponse>> {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, reason: 'NO_FILE' })
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ ok: false, reason: 'NOT_PDF' })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false, reason: 'TOO_LARGE' })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await parseBuildingCertificate(buffer)

    if (!result) {
      return NextResponse.json({ ok: false, reason: 'PARSE_FAILED' })
    }

    return NextResponse.json({
      ok: true,
      totalArea: result.totalArea,
      exclusiveArea: result.exclusiveArea,
      commonArea: result.commonArea,
      totalFloorArea: result.totalFloorArea,
      buildingType: result.buildingType,
    })
  } catch (e) {
    console.error('[parse-building-cert] error', e)
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
