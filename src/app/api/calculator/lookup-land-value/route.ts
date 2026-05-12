import { NextResponse } from 'next/server'
import { geocodeAddress, getLandValueByPoint } from '@/lib/api/vworld'

export type LookupLandValueResponse =
  | {
      ok: true
      landValuePerSqm: number
      pnu: string
      fiscalYear?: number
      noticeDate?: string
    }
  | {
      ok: false
      reason:
        | 'NO_ADDRESS'
        | 'GEOCODE_FAILED'
        | 'LAND_VALUE_NOT_FOUND'
        | 'INTERNAL_ERROR'
    }

interface LookupRequestBody {
  address?: string
}

export async function POST(
  req: Request,
): Promise<NextResponse<LookupLandValueResponse>> {
  try {
    const body = (await req.json()) as LookupRequestBody
    const address = body?.address

    if (!address || address.trim().length === 0) {
      return NextResponse.json({ ok: false, reason: 'NO_ADDRESS' })
    }

    const geo = await geocodeAddress(address)
    if (!geo) {
      return NextResponse.json({ ok: false, reason: 'GEOCODE_FAILED' })
    }

    const land = await getLandValueByPoint(geo.x, geo.y)
    if (!land) {
      return NextResponse.json({ ok: false, reason: 'LAND_VALUE_NOT_FOUND' })
    }

    return NextResponse.json({
      ok: true,
      landValuePerSqm: land.landValuePerSqm,
      pnu: land.pnu,
      fiscalYear: land.fiscalYear,
      noticeDate: land.noticeDate,
    })
  } catch (e) {
    console.error('[lookup-land-value] error', e)
    return NextResponse.json(
      { ok: false, reason: 'INTERNAL_ERROR' },
      { status: 500 },
    )
  }
}
