/**
 * 국토교통부 건축HUB 건축물대장정보 서비스 (공공데이터포털).
 * - 표제부 조회: 일반/단독/다가구주택 연면적
 * - 전유공용면적 조회: 집합건물 (아파트/다세대) 전유 + 공용 합산
 *
 * API 키는 서버 사이드 전용 (BUILDING_REGISTER_API_KEY, NEXT_PUBLIC_ 없음).
 */

import type { PnuParts } from '@/lib/utils/pnu'

const BASE_URL = 'https://apis.data.go.kr/1613000/BldRgstHubService'
const TIMEOUT_MS = 10_000

interface ApiHeader {
  resultCode?: string
  resultMsg?: string
}

interface ApiBody<T> {
  items?: { item?: T | T[] } | T[] | null
  numOfRows?: number | string
  pageNo?: number | string
  totalCount?: number | string
}

interface ApiResponse<T> {
  response?: {
    header?: ApiHeader
    body?: ApiBody<T>
  }
}

async function fetchApi<T>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T[]> {
  const apiKey = process.env.BUILDING_REGISTER_API_KEY
  if (!apiKey) {
    console.error('[building-cert] BUILDING_REGISTER_API_KEY not set')
    return []
  }

  const url = new URL(`${BASE_URL}/${endpoint}`)
  url.searchParams.set('serviceKey', apiKey)
  url.searchParams.set('_type', 'json')
  url.searchParams.set('numOfRows', '1000')
  url.searchParams.set('pageNo', '1')
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') url.searchParams.set(k, v)
  }

  console.log(`[building-cert] calling ${endpoint}`, params)

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AtomTax/1.0)',
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(
        `[building-cert] non-OK ${res.status}`,
        body.slice(0, 300),
      )
      return []
    }

    const json = (await res.json()) as ApiResponse<T>
    console.log(
      `[building-cert] response`,
      JSON.stringify(json).slice(0, 800),
    )

    const resultCode = json.response?.header?.resultCode
    if (resultCode && resultCode !== '00') {
      console.warn(
        `[building-cert] api error code=${resultCode}`,
        json.response?.header?.resultMsg,
      )
      return []
    }

    const body = json.response?.body
    if (!body || !body.items) return []
    if (Array.isArray(body.items)) return body.items as T[]
    const itemContainer = body.items as { item?: T | T[] }
    if (!itemContainer.item) return []
    if (Array.isArray(itemContainer.item)) return itemContainer.item
    return [itemContainer.item]
  } catch (e) {
    console.error(`[building-cert] ${endpoint} failed`, e)
    return []
  }
}

/**
 * 페이지네이션 자동 처리 — 모든 페이지의 items를 합쳐서 반환.
 * 매칭이 클라이언트 측이므로 한 단지의 전체 데이터를 받아야 함.
 * API가 numOfRows를 내부적으로 100건 등으로 캡할 수 있어 페이지 순회로 보완.
 * 최대 10페이지(10,000건) 안전 한계.
 */
async function fetchApiAll<T>(
  endpoint: string,
  params: Record<string, string>,
): Promise<T[]> {
  const apiKey = process.env.BUILDING_REGISTER_API_KEY
  if (!apiKey) {
    console.error('[building-cert] BUILDING_REGISTER_API_KEY not set')
    return []
  }

  const MAX_PAGES = 10
  const NUM_OF_ROWS = 1000
  const all: T[] = []
  let totalCount = 0

  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo++) {
    const url = new URL(`${BASE_URL}/${endpoint}`)
    url.searchParams.set('serviceKey', apiKey)
    url.searchParams.set('_type', 'json')
    url.searchParams.set('numOfRows', String(NUM_OF_ROWS))
    url.searchParams.set('pageNo', String(pageNo))
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') url.searchParams.set(k, v)
    }

    console.log(`[building-cert] calling ${endpoint} (page ${pageNo})`, params)

    try {
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15_000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AtomTax/1.0)',
          Accept: 'application/json',
        },
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(
          `[building-cert] page ${pageNo} non-OK ${res.status}`,
          body.slice(0, 300),
        )
        break
      }
      const json = (await res.json()) as ApiResponse<T>

      const resultCode = json.response?.header?.resultCode
      if (resultCode && resultCode !== '00') {
        console.warn(
          `[building-cert] page ${pageNo} api error code=${resultCode}`,
          json.response?.header?.resultMsg,
        )
        break
      }

      if (pageNo === 1) {
        const tc = json.response?.body?.totalCount
        totalCount = Number(tc) || 0
        console.log(`[building-cert] ${endpoint} totalCount=${totalCount}`)
      }

      const body = json.response?.body
      if (!body || !body.items) break

      let pageItems: T[] = []
      if (Array.isArray(body.items)) {
        pageItems = body.items as T[]
      } else {
        const itemContainer = body.items as { item?: T | T[] }
        if (!itemContainer.item) break
        if (Array.isArray(itemContainer.item)) {
          pageItems = itemContainer.item
        } else {
          pageItems = [itemContainer.item]
        }
      }

      if (pageItems.length === 0) break
      all.push(...pageItems)

      if (totalCount > 0 && all.length >= totalCount) break
      if (pageItems.length < NUM_OF_ROWS) break
    } catch (e) {
      console.error(`[building-cert] page ${pageNo} failed`, e)
      break
    }
  }

  console.log(
    `[building-cert] ${endpoint} totalReceived=${all.length} (of ${totalCount})`,
  )
  return all
}

interface BrTitleItem {
  totArea?: string | number
  platArea?: string | number
  archArea?: string | number
  mainPurpsCdNm?: string
  regstrGbCdNm?: string
  regstrKindCdNm?: string
  bldNm?: string
  dongNm?: string
  mgmBldrgstPk?: string
}

export interface TitleInfoResult {
  totalArea: number
  buildingType: string
  buildingName?: string
  isCollective: boolean
}

export async function getTitleInfo(
  parts: PnuParts,
): Promise<TitleInfoResult | null> {
  const items = await fetchApi<BrTitleItem>('getBrTitleInfo', {
    sigunguCd: parts.sigunguCd,
    bjdongCd: parts.bjdongCd,
    platGbCd: parts.platGbCd,
    bun: parts.bun,
    ji: parts.ji,
  })
  if (items.length === 0) return null

  const sorted = [...items].sort((a, b) => {
    const aArea = Number(a.totArea ?? 0)
    const bArea = Number(b.totArea ?? 0)
    return bArea - aArea
  })

  const best = sorted[0]
  const totalArea = Number(best.totArea)
  if (!Number.isFinite(totalArea) || totalArea <= 0) return null

  return {
    totalArea,
    buildingType: best.mainPurpsCdNm ?? '',
    buildingName: best.bldNm,
    isCollective: best.regstrGbCdNm === '집합',
  }
}

interface BrExposItem {
  area?: string | number
  exposPubuseGbCdNm?: string
  dongNm?: string
  hoNm?: string
  flrNoNm?: string
  regstrKindCdNm?: string
}

export interface ExposResult {
  totalArea: number
  exposArea: number
  pubuseArea: number
  dongNm: string
  hoNm: string
}

/**
 * 문자열에서 첫 번째 연속 숫자 그룹 추출.
 *  - "가락금호아파트 105동 105동" → "105"
 *  - "1702호" → "1702"
 *  - "B1호" → "1"
 *  - "상가동" → ""
 */
function extractNumber(s: unknown): string {
  const str = String(s ?? '')
  const match = str.match(/\d+/)
  return match ? match[0] : ''
}

export async function getExposPubuseArea(
  parts: PnuParts,
  dongNm: string,
  hoNm: string,
): Promise<ExposResult | null> {
  // dongNm/hoNm 모두 API 측 literal과 형식이 달라 정확 일치 검색이 0건 반환됨
  //   - dong: "105" vs API "가락금호아파트 105동 105동"
  //   - ho:   "103호" vs API "103" (호 접미 없음)
  // → API 파라미터에서 둘 다 제거. 해당 PNU의 모든 전유/공용 데이터를 받아
  //   클라이언트에서 숫자 추출 정확 일치로 필터링.
  const params: Record<string, string> = {
    sigunguCd: parts.sigunguCd,
    bjdongCd: parts.bjdongCd,
    platGbCd: parts.platGbCd,
    bun: parts.bun,
    ji: parts.ji,
  }

  const items = await fetchApiAll<BrExposItem>(
    'getBrExposPubuseAreaInfo',
    params,
  )
  if (items.length === 0) return null

  const targetDongNum = extractNumber(dongNm)
  const targetHoNum = extractNumber(hoNm)

  let exposArea = 0
  let pubuseArea = 0
  let matchedDongNm = ''
  let matchedHoNm = ''
  let matchedCount = 0

  for (const item of items) {
    const area = Number(item.area)
    if (!Number.isFinite(area) || area <= 0) continue

    const itemDongNum = extractNumber(item.dongNm)
    const itemHoNum = extractNumber(item.hoNm)

    if (targetDongNum) {
      if (!itemDongNum || itemDongNum !== targetDongNum) continue
    }
    if (targetHoNum) {
      if (!itemHoNum || itemHoNum !== targetHoNum) continue
    }

    matchedCount++
    if (!matchedDongNm) matchedDongNm = String(item.dongNm ?? '')
    if (!matchedHoNm) matchedHoNm = String(item.hoNm ?? '')

    if (item.exposPubuseGbCdNm === '전유') exposArea += area
    else if (item.exposPubuseGbCdNm === '공용') pubuseArea += area
  }

  console.log('[building-cert] exposPubuse summary', {
    totalItems: items.length,
    matched: matchedCount,
    targetDongNum,
    targetHoNum,
    sampleResponses: items.slice(0, 5).map((i) => ({
      hoNm: i.hoNm,
      dongNm: i.dongNm,
      dongNum: extractNumber(i.dongNm),
      hoNum: extractNumber(i.hoNm),
      area: i.area,
      type: i.exposPubuseGbCdNm,
    })),
    exposArea,
    pubuseArea,
  })

  if (exposArea + pubuseArea <= 0) return null

  return {
    totalArea: exposArea + pubuseArea,
    exposArea,
    pubuseArea,
    dongNm: dongNm || matchedDongNm,
    hoNm: hoNm || matchedHoNm,
  }
}
