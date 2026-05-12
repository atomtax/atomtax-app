/**
 * VWorld 데이터 API: 좌표 → 개별공시지가 (PNU 포함).
 *
 * 응답에 여러 연도의 공시지가 이력이 포함될 수 있어,
 * 국세청 PDF §9 나. (2) "양도일과 가장 가까운 시점에 기 공시된 공시지가"에 따라
 * **가장 최근 공시연도** 데이터를 선택한다 (stdr_year 내림차순 + 공시일자 보조).
 *
 * 데이터셋 식별자(`LT_C_LHBLPN`)와 필드명은 추정치이며 실제 응답에 따라
 * 보정 필요. 본 구현은 흔히 쓰이는 별칭들도 함께 검사한다.
 */

import { vworldFetch } from './client'

const VWORLD_DATA = 'https://api.vworld.kr/req/data'
const DATASET_ID = 'LT_C_LHBLPN'
const VWORLD_DEBUG = process.env.VWORLD_DEBUG === '1'

export interface LandValueResult {
  pnu: string
  /** 원/㎡ */
  landValuePerSqm: number
  /** 공시 기준연도 (예: 2025) */
  fiscalYear?: number
  /** 공시 기준일자 또는 공시일자 (YYYY-MM-DD) */
  noticeDate?: string
}

interface LandFeatureProperties {
  pnu?: string
  // 공시지가 (원/㎡) — 흔히 쓰이는 별칭들
  pblntf_pclnd?: string | number
  jiga?: string | number
  pblntf_pclnd_val?: string | number
  amount?: string | number
  // 공시 기준연도
  stdr_year?: string | number
  base_year?: string | number
  // 공시 기준일자 / 공시일자
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

function extractPrice(props: LandFeatureProperties): number {
  const candidates = [
    props.pblntf_pclnd,
    props.pblntf_pclnd_val,
    props.jiga,
    props.amount,
  ]
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue
    const n = Number(c)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

function extractYear(props: LandFeatureProperties): number {
  const candidates = [props.stdr_year, props.base_year]
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue
    // YYYY-MM-DD 형태로 들어올 수 있어 앞 4자리 시도
    const s = String(c).slice(0, 4)
    const n = Number(s)
    if (Number.isFinite(n) && n >= 1900 && n <= 2999) return n
  }
  return 0
}

function extractDate(props: LandFeatureProperties): string {
  return (
    props.stdrde ??
    props.pblntfde ??
    props.base_date ??
    props.notice_date ??
    ''
  )
}

export async function getLandValueByPoint(
  x: number,
  y: number,
): Promise<LandValueResult | null> {
  const apiKey = process.env.VWORLD_API_KEY
  if (!apiKey) {
    console.error('[vworld] VWORLD_API_KEY not set')
    return null
  }

  const url = new URL(VWORLD_DATA)
  url.searchParams.set('service', 'data')
  url.searchParams.set('version', '2.0')
  url.searchParams.set('request', 'GetFeature')
  url.searchParams.set('data', DATASET_ID)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('geomFilter', `POINT(${x} ${y})`)
  url.searchParams.set('crs', 'EPSG:4326')
  // 여러 연도 데이터를 모두 받기 위해 size 크게
  url.searchParams.set('size', '30')
  url.searchParams.set('page', '1')
  url.searchParams.set('geometry', 'false')
  url.searchParams.set('attribute', 'true')

  const data = (await vworldFetch(url)) as LandApiResponse | null
  if (VWORLD_DEBUG) {
    console.log('[vworld debug land-value]', JSON.stringify(data, null, 2))
  }
  if (!data?.response || data.response.status !== 'OK') return null

  const features = data.response.result?.featureCollection?.features ?? []
  if (features.length === 0) return null

  // 가장 최근 공시 데이터 선택: stdr_year 내림차순, 동률은 공시일자 내림차순
  const sorted = [...features].sort((a, b) => {
    const yearA = extractYear(a.properties ?? {})
    const yearB = extractYear(b.properties ?? {})
    if (yearA !== yearB) return yearB - yearA
    const dateA = extractDate(a.properties ?? {})
    const dateB = extractDate(b.properties ?? {})
    return dateB.localeCompare(dateA)
  })

  const latest = sorted[0]
  if (!latest?.properties) return null

  const price = extractPrice(latest.properties)
  if (price <= 0) return null

  const fiscalYear = extractYear(latest.properties) || undefined
  const noticeDate = extractDate(latest.properties) || undefined

  return {
    pnu: String(latest.properties.pnu ?? ''),
    landValuePerSqm: price,
    fiscalYear,
    noticeDate,
  }
}
