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
  useAprDay?: string
  strctCdNm?: string
}

export interface TitleInfoResult {
  totalArea: number
  buildingType: string
  buildingName?: string
  isCollective: boolean
  completionYear?: number
  structureRaw?: string
  structureId?: string
  usageId?: string
}

function extractYearFromYmd(ymd: unknown): number | undefined {
  if (typeof ymd !== 'string' || ymd.length < 4) return undefined
  const year = parseInt(ymd.substring(0, 4), 10)
  if (Number.isFinite(year) && year >= 1900 && year <= 2100) return year
  return undefined
}

/**
 * 표제부 API의 strctCdNm("철근콘크리트구조" 등) → STRUCTURES의 id 매핑.
 * 구체적인 키워드부터 검사 (철골 vs 철골철근콘크리트, 목구조 vs 목조 등).
 */
function mapStructureNameToId(name: string | undefined): string | undefined {
  if (!name) return undefined
  const s = name.replace(/\s+/g, '')

  if (s.includes('철골') && s.includes('철근') && s.includes('콘크리트')) {
    return 'cheolgolcheolgeun'
  }
  if (s.includes('철근') && s.includes('콘크리트')) return 'cheolgeun'
  if (s.includes('보강') && s.includes('콘크리트')) return 'bogangconcrete'
  if (s.includes('프리캐스트') || s.includes('PC조')) return 'precast'
  if (s.includes('라멘')) return 'rahmen'
  if (s.includes('EPS') || (s.includes('조립식') && s.includes('패널') && s.includes('철골'))) {
    return 'eps_panel'
  }
  if (s.includes('경량') && s.includes('철골')) return 'kyungryang'
  if (s.includes('철골')) return 'cheolgol'
  if (s.includes('통나무')) return 'tongnamu'
  if (s.includes('목구조')) return 'mokgu'
  if (s.includes('목조')) return 'moko'
  if (s.includes('ALC')) return 'alc'
  if (s.includes('스틸하우스')) return 'steelhouse'
  if (s.includes('연와')) return 'yeonwa'
  if (s.includes('보강') && s.includes('블록')) return 'bogangblock'
  if (s.includes('시멘트벽돌')) return 'cementbrick'
  if (s.includes('황토')) return 'hwangto'
  if (s.includes('시멘트블록')) return 'cementblock'
  if (s.includes('와이어패널')) return 'wirepanel'
  if (s.includes('조립식') && s.includes('패널')) return 'joriphsik'
  if (s.includes('석회') || s.includes('흙벽돌') || s.includes('돌담') || s.includes('토담')) {
    return 'seokhwe_etc'
  }
  if (s.includes('철파이프')) return 'cheolpipe'
  if (s.includes('컨테이너')) return 'container'
  if (s.includes('석조')) return 'seokjo'
  return undefined
}

/**
 * 표제부 API의 mainPurpsCdNm("공동주택" 등) → BUILDING_USES.code(string) 매핑.
 * PR #97 이후 주거용/상업용 1차 분기 지원. 자동조회는 표제부의 mainPurpsCdNm을
 * 기반으로 주거용 2개 코드(1=아파트, 2=단독·다세대 등)와 일부 명확한 상업용
 * 키워드만 매핑한다. 모호한 케이스는 undefined 반환 → 사용자가 직접 선택.
 */
function mapMainPurpsToUsageId(name: string | undefined): string | undefined {
  if (!name) return undefined
  // 주거용
  if (name.includes('아파트')) return '1'
  if (name.includes('공동주택')) return '1'
  if (
    name.includes('단독주택') ||
    name.includes('다가구주택') ||
    name.includes('다중주택') ||
    name.includes('연립주택') ||
    name.includes('다세대주택') ||
    name.includes('기숙사') ||
    name.includes('도시형')
  ) {
    return '2'
  }
  // 상업용 — 명확한 키워드만 자동 매핑
  if (name.includes('오피스텔')) return '28'
  if (name.includes('근린생활시설')) return '41'
  if (name.includes('업무시설')) return '29'
  return undefined
}

function extractNumber(s: unknown): string {
  const str = String(s ?? '')
  const match = str.match(/\d+/)
  return match ? match[0] : ''
}

/**
 * 사용자 입력 동수와 매칭되는 표제부 항목 선택.
 * - dongNm 비어있거나 매칭 실패 시 totArea 가장 큰 항목으로 폴백.
 */
function pickTitleItemForDong(
  items: BrTitleItem[],
  dongNm: string,
): BrTitleItem | undefined {
  const targetDongNum = extractNumber(dongNm)
  if (targetDongNum) {
    const matched = items.find(
      (item) => extractNumber(item.dongNm) === targetDongNum,
    )
    if (matched) return matched
  }
  return [...items].sort((a, b) => {
    const aArea = Number(a.totArea ?? 0)
    const bArea = Number(b.totArea ?? 0)
    return bArea - aArea
  })[0]
}

/**
 * 표제부 조회 — 사용자 입력 동(dongNm) 기준으로 매칭되는 동의 메타 정보 반환.
 * dongNm 미지정 시 가장 큰 동 (단독주택 케이스).
 */
export async function getTitleInfo(
  parts: PnuParts,
  dongNm: string = '',
): Promise<TitleInfoResult | null> {
  const items = await fetchApi<BrTitleItem>('getBrTitleInfo', {
    sigunguCd: parts.sigunguCd,
    bjdongCd: parts.bjdongCd,
    platGbCd: parts.platGbCd,
    bun: parts.bun,
    ji: parts.ji,
  })
  if (items.length === 0) return null

  const picked = pickTitleItemForDong(items, dongNm)
  if (!picked) return null

  const totalArea = Number(picked.totArea)
  if (!Number.isFinite(totalArea) || totalArea <= 0) return null

  return {
    totalArea,
    buildingType: picked.mainPurpsCdNm ?? '',
    buildingName: picked.bldNm,
    isCollective: picked.regstrGbCdNm === '집합',
    completionYear: extractYearFromYmd(picked.useAprDay),
    structureRaw: picked.strctCdNm,
    structureId: mapStructureNameToId(picked.strctCdNm),
    usageId: mapMainPurpsToUsageId(picked.mainPurpsCdNm),
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
 * 빠른 PNU 확인 — 해당 PNU에 건축물대장 전유공용 데이터가 존재하는지 카운트만 반환.
 * VWorld가 잘못된 부번을 골랐을 경우 변형 PNU를 빠르게 시도하기 위한 헬퍼 (PR #110).
 */
export async function probeExposApi(parts: PnuParts): Promise<number> {
  const items = await fetchApi<BrExposItem>('getBrExposPubuseAreaInfo', {
    sigunguCd: parts.sigunguCd,
    bjdongCd: parts.bjdongCd,
    platGbCd: parts.platGbCd,
    bun: parts.bun,
    ji: parts.ji,
  })
  return items.length
}

/**
 * 빠른 PNU 확인 (표제부 버전) — 단독주택 케이스 (동/호 미입력) 자동 PNU 변형용.
 */
export async function probeTitleApi(parts: PnuParts): Promise<number> {
  const items = await fetchApi<BrTitleItem>('getBrTitleInfo', {
    sigunguCd: parts.sigunguCd,
    bjdongCd: parts.bjdongCd,
    platGbCd: parts.platGbCd,
    bun: parts.bun,
    ji: parts.ji,
  })
  return items.length
}

/**
 * 내부 헬퍼: 주어진 hoNm으로 한 번 시도.
 * 매칭된 결과가 있으면 ExposResult 반환, 없으면 null.
 *
 * @param attemptHoNm API에 보낼 hoNm. 빈 문자열이면 hoNm 파라미터 생략(=전체 조회).
 * @param targetHoNm 클라이언트 측 필터 기준 (사용자 원본 호 입력의 숫자)
 */
async function tryExposLookup(
  parts: PnuParts,
  dongNm: string,
  attemptHoNm: string,
  targetHoNm: string,
): Promise<ExposResult | null> {
  const params: Record<string, string> = {
    sigunguCd: parts.sigunguCd,
    bjdongCd: parts.bjdongCd,
    platGbCd: parts.platGbCd,
    bun: parts.bun,
    ji: parts.ji,
  }
  if (attemptHoNm) params.hoNm = attemptHoNm

  const items = await fetchApi<BrExposItem>('getBrExposPubuseAreaInfo', params)
  console.log('[building-cert] expos lookup', {
    dongNm,
    attemptHoNm: attemptHoNm || '(omitted)',
    targetHoNm,
    itemCount: items.length,
  })
  if (items.length === 0) return null

  const targetDongNum = extractNumber(dongNm)
  const targetHoNum = extractNumber(targetHoNm)

  let exposArea = 0
  let pubuseArea = 0
  let matchedDongNm = ''
  let matchedHoNm = ''

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

    if (!matchedDongNm) matchedDongNm = String(item.dongNm ?? '')
    if (!matchedHoNm) matchedHoNm = String(item.hoNm ?? '')

    if (item.exposPubuseGbCdNm === '전유') exposArea += area
    else if (item.exposPubuseGbCdNm === '공용') pubuseArea += area
  }

  if (exposArea + pubuseArea <= 0) return null

  return {
    totalArea: exposArea + pubuseArea,
    exposArea,
    pubuseArea,
    dongNm: dongNm || matchedDongNm,
    hoNm: targetHoNm || matchedHoNm,
  }
}

/**
 * 전유공용면적 조회 — 자동 재시도 포함.
 *
 * 일부 단지(태형팰리스 등 오피스텔/구형 단지)는 API에 hoNm이 zero-pad 4자리
 * 또는 "호" 접미 여부가 다르게 저장됨 → 여러 변형 시도 + 최종에 hoNm 생략 후
 * 단지 전체를 받아 클라이언트 측 매칭 (PR #109 보강).
 *
 * 시도 순서:
 *   1. 사용자 입력 그대로 (예: "904호")
 *   2. 숫자만 (예: "904")
 *   3. 4자리 zero-pad (예: "0904")
 *   4. 4자리 zero-pad + 호 (예: "0904호")
 *   5. 최종 폴백: hoNm 생략하고 단지 전체 받아 클라이언트 측 필터
 */
export async function getExposPubuseArea(
  parts: PnuParts,
  dongNm: string,
  hoNm: string,
): Promise<ExposResult | null> {
  if (!hoNm) {
    // 호 미입력 — 그대로 한 번만
    return tryExposLookup(parts, dongNm, '', '')
  }

  const hoNumber = extractNumber(hoNm)
  if (!hoNumber) return null

  // 시도할 hoNm 변형 목록 (중복 제거)
  const variants = new Set<string>([hoNm])
  variants.add(hoNumber)
  variants.add(`${hoNumber}호`)
  if (hoNumber.length < 4) {
    const padded = hoNumber.padStart(4, '0')
    variants.add(padded)
    variants.add(`${padded}호`)
  }

  for (const variant of variants) {
    const result = await tryExposLookup(parts, dongNm, variant, hoNumber)
    if (result) return result
  }

  // 최종 폴백: hoNm 파라미터 생략 → 단지 전체 → 클라이언트 측 매칭
  // 일부 단지는 hoNm을 어떤 형식으로 보내도 매칭 안 됨 (DB 등록 형식 차이)
  console.log('[building-cert] expos fallback: omit hoNm', { dongNm, hoNumber })
  return tryExposLookup(parts, dongNm, '', hoNumber)
}
