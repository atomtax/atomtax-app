/**
 * 수도권정비계획법 시행령 별표 1 (2024.1.20 기준)
 *
 * 조세특례제한법 §6 창업감면율 판단을 위한 권역 분류.
 * 향후 시행령 개정 시 데이터 갱신 필요.
 *
 * 권역 분류:
 *   - overcrowded           : 과밀억제권역 (창업감면 X)
 *   - metro_non_overcrowded : 수도권 비과밀 (성장관리 + 자연보전)
 *   - non_metro             : 비수도권
 */

export type RegionZone =
  | 'overcrowded'
  | 'metro_non_overcrowded'
  | 'non_metro'

interface OvercrowdedArea {
  region: string
  scope: 'all' | 'partial'
  partialMatcher?: (address: string) => boolean
}

/**
 * 과밀억제권역 시군구 목록
 * - 서울 전체, 인천 일부, 경기 일부
 * - 일부 시는 특정 동/구만 포함 → partialMatcher로 분기
 */
const OVERCROWDED_AREAS: OvercrowdedArea[] = [
  // 서울 전체
  { region: '서울특별시', scope: 'all' },
  { region: '서울시', scope: 'all' },

  // 인천 (강화군/옹진군/서구 일부/경제자유구역/남동 국가산단 제외)
  {
    region: '인천광역시',
    scope: 'partial',
    partialMatcher: (addr) => {
      if (/강화군|옹진군/.test(addr)) return false
      if (/서구.*(대곡|불로|마전|금곡|오류|왕길|당하|원당)동/.test(addr)) return false
      return true
    },
  },

  // 경기 시(전체)
  { region: '의정부시', scope: 'all' },
  { region: '구리시', scope: 'all' },
  { region: '하남시', scope: 'all' },
  { region: '고양시', scope: 'all' },
  { region: '수원시', scope: 'all' },
  { region: '성남시', scope: 'all' },
  { region: '안양시', scope: 'all' },
  { region: '부천시', scope: 'all' },
  { region: '광명시', scope: 'all' },
  { region: '과천시', scope: 'all' },
  { region: '의왕시', scope: 'all' },
  { region: '군포시', scope: 'all' },

  // 남양주시 (특정 동만 과밀)
  {
    region: '남양주시',
    scope: 'partial',
    partialMatcher: (addr) =>
      /(호평|평내|금곡|일패|이패|삼패|가운|수석|지금|도농)동/.test(addr),
  },

  // 시흥시 (반월특수지역 제외)
  {
    region: '시흥시',
    scope: 'partial',
    partialMatcher: (addr) => !/반월/.test(addr),
  },
]

/**
 * 수도권 비과밀 (성장관리권역 + 자연보전권역) 시군구 목록
 * - 위 OVERCROWDED_AREAS에 안 잡힌 경기/인천 시군구
 */
const METRO_NON_OVERCROWDED_AREAS = [
  // 성장관리권역
  '동두천시',
  '안산시',
  '오산시',
  '평택시',
  '파주시',
  '연천군',
  '포천시',
  '양주시',
  '김포시',
  '화성시',
  '안성시',
  '용인시',

  // 자연보전권역
  '이천시',
  '양평군',
  '여주시',
  '광주시', // 경기 광주 — 광주광역시는 별도 처리
  '가평군',
]

/**
 * 주소 → 권역 판단
 *
 * @param address 사업장 주소 (예: "경기도 시흥시 서울대학로 328")
 * @returns 권역 코드 (주소가 비어있으면 보수적으로 'non_metro')
 */
export function getRegionZone(address: string | null | undefined): RegionZone {
  if (!address) return 'non_metro'

  const addr = address.trim()

  // 1. 과밀억제권역
  for (const area of OVERCROWDED_AREAS) {
    if (!addr.includes(area.region)) continue
    if (area.scope === 'all') return 'overcrowded'
    if (area.scope === 'partial' && area.partialMatcher?.(addr)) return 'overcrowded'
  }

  // 2. 수도권 비과밀
  // 인천 일부 (강화/옹진/서구 일부)
  if (/인천광역시/.test(addr)) {
    if (/강화군|옹진군/.test(addr)) return 'metro_non_overcrowded'
    if (/서구.*(대곡|불로|마전|금곡|오류|왕길|당하|원당)동/.test(addr)) {
      return 'metro_non_overcrowded'
    }
  }

  // 경기도 + 비과밀 시군구
  if (/경기도/.test(addr)) {
    for (const area of METRO_NON_OVERCROWDED_AREAS) {
      if (addr.includes(area)) return 'metro_non_overcrowded'
    }
    // 남양주/시흥은 과밀 partialMatcher에 안 잡혔으면 비과밀
    if (/남양주시|시흥시/.test(addr)) return 'metro_non_overcrowded'
  }

  // 3. 그 외 = 비수도권
  return 'non_metro'
}

/**
 * 한글 권역명 (UI 표시용)
 */
export function getRegionZoneName(zone: RegionZone): string {
  switch (zone) {
    case 'overcrowded':
      return '과밀억제권역'
    case 'metro_non_overcrowded':
      return '수도권 비과밀'
    case 'non_metro':
      return '비수도권'
  }
}
