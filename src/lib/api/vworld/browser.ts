'use client'

/**
 * VWorld API 클라이언트 측 호출 모듈.
 * - 브라우저에서 직접 호출 → Vercel IP 차단 회피
 * - API 키는 NEXT_PUBLIC_VWORLD_API_KEY (클라이언트 번들에 노출됨)
 *   → VWorld의 domain 검증으로 보호 (등록된 도메인에서만 키 동작)
 */

const VWORLD_ADDRESS = 'https://api.vworld.kr/req/address'
const VWORLD_DATA = 'https://api.vworld.kr/req/data'
const TIMEOUT_MS = 5000
const DATASET_ID = 'LT_C_LHBLPN'

export interface GeocodeResult {
  x: number
  y: number
  refinedAddress?: string
}

export interface LandValueResult {
  pnu: string
  landValuePerSqm: number
  fiscalYear?: number
  noticeDate?: string
}

type AddressType = 'ROAD' | 'PARCEL'

/** 주소 → 좌표. 도로명 우선, 실패 시 지번으로 자동 폴백 */
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  const trimmed = address.trim()
  if (!trimmed) return null
  const road = await geocodeWithType(trimmed, 'ROAD')
  if (road) return road
  return geocodeWithType(trimmed, 'PARCEL')
}

async function geocodeWithType(
  address: string,
  type: AddressType,
): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY
  if (!apiKey) {
    console.error('[vworld-browser] NEXT_PUBLIC_VWORLD_API_KEY not set')
    return null
  }

  const url = new URL(VWORLD_ADDRESS)
  url.searchParams.set('service', 'address')
  url.searchParams.set('request', 'getCoord')
  url.searchParams.set('version', '2.0')
  url.searchParams.set('crs', 'EPSG:4326')
  url.searchParams.set('type', type)
  url.searchParams.set('address', address)
  url.searchParams.set('format', 'json')
  url.searchParams.set('key', apiKey)

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) {
      console.warn(`[vworld-browser] geocode ${type} non-OK ${res.status}`)
      return null
    }
    const data = (await res.json()) as GeocodeApiResponse
    if (data?.response?.status !== 'OK') {
      console.warn(
        `[vworld-browser] geocode ${type} status=${data?.response?.status}`,
      )
      return null
    }
    const point = data.response.result?.point
    if (!point) return null

    const x = Number(point.x)
    const y = Number(point.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null

    return {
      x,
      y,
      refinedAddress: data.response.refined?.text,
    }
  } catch (e) {
    console.error(`[vworld-browser] geocode ${type} failed`, e)
    return null
  }
}

interface GeocodeApiResponse {
  response?: {
    status?: string
    result?: { point?: { x: string | number; y: string | number } }
    refined?: { text?: string }
  }
}

interface LandFeatureProperties {
  pnu?: string
  pblntf_pclnd?: string | number
  jiga?: string | number
  pblntf_pclnd_val?: string | number
  amount?: string | number
  stdr_year?: string | number
  base_year?: string | number
  stdrde?: string
  pblntfde?: string
  base_date?: string
  notice_date?: string
}

interface LandApiResponse {
  response?: {
    status?: string
    result?: {
      featureCollection?: {
        features?: Array<{ properties?: LandFeatureProperties }>
      }
    }
  }
}

function extractPrice(p: LandFeatureProperties): number {
  const candidates = [p.pblntf_pclnd, p.pblntf_pclnd_val, p.jiga, p.amount]
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue
    const n = Number(c)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

function extractYear(p: LandFeatureProperties): number {
  const candidates = [p.stdr_year, p.base_year]
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue
    const s = String(c).slice(0, 4)
    const n = Number(s)
    if (Number.isFinite(n) && n >= 1900 && n <= 2999) return n
  }
  return 0
}

function extractDate(p: LandFeatureProperties): string {
  return p.stdrde ?? p.pblntfde ?? p.base_date ?? p.notice_date ?? ''
}

/** 좌표 → 개별공시지가 (가장 최근 공시연도 선택) */
export async function getLandValueByPoint(
  x: number,
  y: number,
): Promise<LandValueResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY
  if (!apiKey) return null

  const url = new URL(VWORLD_DATA)
  url.searchParams.set('service', 'data')
  url.searchParams.set('version', '2.0')
  url.searchParams.set('request', 'GetFeature')
  url.searchParams.set('data', DATASET_ID)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('geomFilter', `POINT(${x} ${y})`)
  url.searchParams.set('crs', 'EPSG:4326')
  url.searchParams.set('size', '30')
  url.searchParams.set('page', '1')
  url.searchParams.set('geometry', 'false')
  url.searchParams.set('attribute', 'true')

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) {
      console.warn(`[vworld-browser] land-value non-OK ${res.status}`)
      return null
    }
    const data = (await res.json()) as LandApiResponse
    // 응답 구조 확인용 디버그 (검증 후 제거)
    console.log('[vworld-browser debug] land-value response:', data)

    if (data?.response?.status !== 'OK') {
      console.warn(
        `[vworld-browser] land-value status=${data?.response?.status}`,
      )
      return null
    }

    const features =
      data.response.result?.featureCollection?.features ?? []
    if (features.length === 0) return null

    const sorted = [...features].sort((a, b) => {
      const yearA = extractYear(a.properties ?? {})
      const yearB = extractYear(b.properties ?? {})
      if (yearA !== yearB) return yearB - yearA
      const dateA = extractDate(a.properties ?? {})
      const dateB = extractDate(b.properties ?? {})
      return dateB.localeCompare(dateA)
    })

    const latest = sorted[0]?.properties
    if (!latest) return null
    const price = extractPrice(latest)
    if (price <= 0) return null

    return {
      pnu: String(latest.pnu ?? ''),
      landValuePerSqm: price,
      fiscalYear: extractYear(latest) || undefined,
      noticeDate: extractDate(latest) || undefined,
    }
  } catch (e) {
    console.error('[vworld-browser] land-value failed', e)
    return null
  }
}
