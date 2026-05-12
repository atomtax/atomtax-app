'use client'

/**
 * VWorld API 클라이언트 측 호출 모듈 (JSONP).
 * - VWorld는 CORS 헤더를 보내지 않아 fetch는 차단됨
 * - `callback` 파라미터를 지원하므로 <script> 태그 로드 방식(JSONP)으로 우회
 * - API 키는 NEXT_PUBLIC_VWORLD_API_KEY (클라이언트 번들에 노출됨)
 *   → VWorld의 domain 검증으로 보호 (등록된 도메인에서만 키 동작)
 */

const VWORLD_ADDRESS = 'https://api.vworld.kr/req/address'
const VWORLD_DATA = 'https://api.vworld.kr/req/data'
const VWORLD_LAND_PRICE =
  'https://api.vworld.kr/ned/data/getIndvdLandPriceAttr'
const TIMEOUT_MS = 10_000
const CADASTRAL_DATASET = 'LP_PA_CBND_BUBUN'

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

/** JSONP 헬퍼 — VWorld의 callback 파라미터 활용해 CORS 우회 */
function vworldJsonp<T>(baseUrl: URL): Promise<T | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }

    const cbName = `__vworld_cb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const winRef = window as unknown as Record<string, unknown>
    const script = document.createElement('script')
    let resolved = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (script.parentNode) document.head.removeChild(script)
      delete winRef[cbName]
    }

    const finish = (value: T | null) => {
      if (resolved) return
      resolved = true
      cleanup()
      resolve(value)
    }

    winRef[cbName] = (data: T) => finish(data)

    const url = new URL(baseUrl.toString())
    url.searchParams.set('callback', cbName)
    script.src = url.toString()
    script.onerror = () => {
      console.error('[vworld-jsonp] script load failed')
      finish(null)
    }
    timeoutId = setTimeout(() => finish(null), TIMEOUT_MS)

    document.head.appendChild(script)
  })
}

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

interface PnuApiResponse {
  response?: {
    status?: string
    result?: {
      featureCollection?: {
        features?: Array<{
          properties?: {
            pnu?: string
            jibun?: string
          }
        }>
      }
    }
    error?: { code?: string; text?: string }
  }
}

function getBrowserDomain(): string {
  return typeof window !== 'undefined' ? window.location.hostname : ''
}

/**
 * 좌표 → PNU (필지 고유번호 19자리).
 * VWorld 연속지적도 데이터(LP_PA_CBND_BUBUN) 활용.
 */
async function getPnuByPoint(x: number, y: number): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY
  if (!apiKey) {
    console.error('[vworld-browser] NEXT_PUBLIC_VWORLD_API_KEY not set')
    return null
  }

  const url = new URL(VWORLD_DATA)
  url.searchParams.set('service', 'data')
  url.searchParams.set('version', '2.0')
  url.searchParams.set('request', 'GetFeature')
  url.searchParams.set('data', CADASTRAL_DATASET)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('geomFilter', `POINT(${x} ${y})`)
  url.searchParams.set('crs', 'EPSG:4326')
  url.searchParams.set('size', '1')
  url.searchParams.set('page', '1')
  url.searchParams.set('geometry', 'false')
  url.searchParams.set('attribute', 'true')
  url.searchParams.set('domain', getBrowserDomain())

  const data = await vworldJsonp<PnuApiResponse>(url)
  console.log('[vworld-browser debug] pnu lookup response:', data)

  if (!data) {
    console.warn('[vworld-browser] pnu lookup no response')
    return null
  }
  if (data?.response?.status !== 'OK') {
    console.warn(
      `[vworld-browser] pnu lookup status=${data?.response?.status}`,
      data?.response?.error,
    )
    return null
  }
  const features = data.response.result?.featureCollection?.features ?? []
  if (features.length === 0) {
    console.warn('[vworld-browser] no parcel at this point')
    return null
  }
  const pnu = features[0]?.properties?.pnu
  if (!pnu || pnu.length < 19) {
    console.warn('[vworld-browser] invalid pnu format', pnu)
    return null
  }
  return pnu
}

interface LandPriceItem {
  pnu?: string
  ldCode?: string
  ldCodeNm?: string
  regstrSeCode?: string
  regstrSeCodeNm?: string
  mnnmSlno?: string
  stdrYear?: string | number
  stdrMt?: string | number
  pblntfPclnd?: string | number
  pblntfDe?: string
  stdLandAt?: string
  lastUpdtDt?: string
}

interface LandPriceApiResponse {
  // 실제 응답: indvdLandPrices.field 배열에 데이터
  indvdLandPrices?: {
    field?: LandPriceItem[]
    totalCount?: string | number
    numOfRows?: string | number
    pageNo?: string | number
    resultCode?: string
    resultMsg?: string
  }
  // 백업 폴백 (구조 변경 대비)
  response?: {
    status?: string
    result?: {
      items?: LandPriceItem[]
      item?: LandPriceItem[]
    }
    body?: {
      items?: LandPriceItem[]
    }
    error?: { code?: string; text?: string }
  }
}

function extractLandPriceItems(data: LandPriceApiResponse): LandPriceItem[] {
  // 우선: indvdLandPrices.field (실제 응답 구조)
  const field = data.indvdLandPrices?.field
  if (field && Array.isArray(field)) return field
  // 백업: response.result.items / item / body.items
  const result = data.response?.result
  if (result?.items && Array.isArray(result.items)) return result.items
  if (result?.item && Array.isArray(result.item)) return result.item
  const bodyItems = data.response?.body?.items
  if (bodyItems && Array.isArray(bodyItems)) return bodyItems
  return []
}

function extractPriceFromItem(item: LandPriceItem): number {
  const candidates: unknown[] = [
    item.pblntfPclnd,
    (item as Record<string, unknown>).pblntf_pclnd,
    (item as Record<string, unknown>).pblntfPclndAmount,
    (item as Record<string, unknown>).price,
  ]
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue
    const n = Number(c)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

/** PNU로 개별공시지가 조회 (가장 최근 공시연도 반환) */
async function getLandValueByPnu(pnu: string): Promise<LandValueResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY
  if (!apiKey) return null

  const url = new URL(VWORLD_LAND_PRICE)
  url.searchParams.set('pnu', pnu)
  url.searchParams.set('format', 'json')
  url.searchParams.set('numOfRows', '30')
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('domain', getBrowserDomain())

  const data = await vworldJsonp<LandPriceApiResponse>(url)
  console.log('[vworld-browser debug] land-value response:', data)

  if (!data) {
    console.warn('[vworld-browser] land-value no response')
    return null
  }

  // 1) 백업 구조의 status (있다면 실패)
  if (data.response?.status && data.response.status !== 'OK') {
    console.warn(
      `[vworld-browser] land-value status=${data.response.status}`,
      data.response.error,
    )
    return null
  }
  // 2) 실제 구조의 resultCode (빈 문자열/'00'/'NORMAL'은 성공)
  const resultCode = data.indvdLandPrices?.resultCode
  if (
    resultCode !== undefined &&
    resultCode !== '' &&
    resultCode !== '00' &&
    resultCode !== 'NORMAL'
  ) {
    console.warn(
      `[vworld-browser] land-value resultCode=${resultCode}`,
      data.indvdLandPrices?.resultMsg,
    )
    return null
  }

  const items = extractLandPriceItems(data)
  if (items.length === 0) {
    console.warn('[vworld-browser] no land price records for this pnu')
    return null
  }
  console.log(
    `[vworld-browser] found ${items.length} records (total: ${data.indvdLandPrices?.totalCount ?? '?'})`,
  )

  const sorted = [...items].sort((a, b) => {
    const yearA = Number(a.stdrYear ?? 0)
    const yearB = Number(b.stdrYear ?? 0)
    if (yearA !== yearB) return yearB - yearA
    const dateA = String(a.pblntfDe ?? '')
    const dateB = String(b.pblntfDe ?? '')
    return dateB.localeCompare(dateA)
  })

  const latest = sorted[0]
  const price = extractPriceFromItem(latest)
  if (price <= 0) {
    console.warn('[vworld-browser] invalid price value', latest)
    return null
  }

  const year = Number(latest.stdrYear)
  return {
    pnu: String(latest.pnu ?? pnu),
    landValuePerSqm: price,
    fiscalYear: Number.isFinite(year) && year > 0 ? year : undefined,
    noticeDate: latest.pblntfDe ? String(latest.pblntfDe) : undefined,
  }
}

interface GeocodeApiResponse {
  response?: {
    status?: string
    result?: { point?: { x: string | number; y: string | number } }
    refined?: { text?: string }
    error?: { code?: string; text?: string }
  }
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

  const data = await vworldJsonp<GeocodeApiResponse>(url)
  if (!data) {
    console.warn(`[vworld-browser] geocode ${type} no response`)
    return null
  }
  if (data?.response?.status !== 'OK') {
    console.warn(
      `[vworld-browser] geocode ${type} status=${data?.response?.status}`,
      data?.response?.error,
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
}

/**
 * 좌표 → 공시지가 (내부적으로 PNU 변환 후 PNU 기반 조회).
 * LandValueField에서는 좌표를 받아 호출하므로 기존 시그니처 유지.
 */
export async function getLandValueByPoint(
  x: number,
  y: number,
): Promise<LandValueResult | null> {
  const pnu = await getPnuByPoint(x, y)
  if (!pnu) {
    console.warn('[vworld-browser] failed to get PNU from coordinates')
    return null
  }
  return getLandValueByPnu(pnu)
}
