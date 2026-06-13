/**
 * 위하고 Request URL 파서 (Phase 7 / 1단계)
 *
 * 붙여넣은 Request URL에서 식별 정보를 추출하는 순수 함수.
 * 화면별 분기 대신 탐색 우선순위(generic fallback)로 처리해서
 * 새 화면이 추가돼도 대부분 동작하도록 한다.
 */

export interface WehagoUrlInfo {
  screenCode: string // '/smarta/' 다음 경로 세그먼트 ('sacl0106' 등)
  ccode: string | null
  gisu: number | null
  ymInsa: string | null
  periodFrom: string | null // 'YYYYMM'
  periodTo: string | null // 'YYYYMM'
}

/** 'YYYYMMDD' 또는 'YYYYMM' 문자열에서 앞 6자리(YYYYMM)만 취함 */
function toYearMonth(value: string | null): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length < 6) return null
  return digits.slice(0, 6)
}

/**
 * Request URL 파싱. URL이 깨져도 throw하지 않고 가능한 값만 채운다.
 * 알 수 없는 화면코드여도 screenCode를 그대로 반환 (저장은 허용).
 */
export function parseWehagoUrl(rawUrl: string): WehagoUrlInfo {
  const empty: WehagoUrlInfo = {
    screenCode: '',
    ccode: null,
    gisu: null,
    ymInsa: null,
    periodFrom: null,
    periodTo: null,
  }

  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return empty
  }

  // 화면코드: pathname의 '/smarta/' 바로 다음 세그먼트
  let screenCode = ''
  const idx = url.pathname.indexOf('/smarta/')
  if (idx !== -1) {
    const rest = url.pathname.slice(idx + '/smarta/'.length)
    screenCode = rest.split('/').filter(Boolean)[0] ?? ''
  }

  const q = url.searchParams
  const gisuRaw = q.get('gisu')
  const gisu = gisuRaw != null && /^\d+$/.test(gisuRaw) ? parseInt(gisuRaw, 10) : null

  // periodTo: end_date → dm_fndend → to → da_date 중 첫 값
  const periodTo = toYearMonth(
    q.get('end_date') ?? q.get('dm_fndend') ?? q.get('to') ?? q.get('da_date'),
  )
  // periodFrom: acc_start_date → dm_fndbegin → from 중 첫 값
  const periodFrom = toYearMonth(
    q.get('acc_start_date') ?? q.get('dm_fndbegin') ?? q.get('from'),
  )

  return {
    screenCode,
    ccode: q.get('ccode'),
    gisu,
    ymInsa: q.get('ym_insa'),
    periodFrom,
    periodTo,
  }
}
