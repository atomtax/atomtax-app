/**
 * 위하고 수집 코어 로직 (Phase 7 / 1단계)
 *
 * 폼 서버 액션과 (2단계의) API 라우트가 모두 호출할 수 있는 순수한 형태.
 * 입력: { url, jsonText }. 처리: URL 파싱 → JSON 파싱 → 마스킹 → 해시 →
 *  sabc0102면 회사 매핑 UPSERT, 그 외면 스냅샷 INSERT(중복은 "변경 없음").
 */

import type { createClient } from '@/lib/supabase/server'
import type { Json } from './types'
import { WEHAGO_SCREEN } from './types'
import { parseWehagoUrl } from './parse-url'
import { sanitizeWehagoPayload } from './sanitize'
import { contentHash } from './hash'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export interface IngestInput {
  url: string
  jsonText: string
}

export interface IngestResult {
  ok: boolean
  result?: '신규 저장' | '변경 없음' | '회사정보 갱신'
  companyName?: string
  matchedClientName?: string
  warning?: string
  error?: string
}

/** 'YYYYMMDD' → 'YYYY-MM-DD' (date 컬럼용). 형식이 아니면 null */
function toDateString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const d = value.replace(/\D/g, '')
  if (d.length !== 8) return null
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
}

function digitsOnly(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const d = String(value).replace(/\D/g, '')
  return d.length > 0 ? d : null
}

/** clients.business_number(3-2-5 하이픈 저장)와 숫자만 비교할 후보 문자열 생성 */
function businessNumberCandidates(digits: string): string[] {
  const hyphenated =
    digits.length === 10
      ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
      : null
  return Array.from(new Set([digits, hyphenated].filter((v): v is string => !!v)))
}

export async function ingestWehagoData(
  supabase: SupabaseServerClient,
  input: IngestInput,
): Promise<IngestResult> {
  // 1. URL 파싱
  const urlInfo = parseWehagoUrl(input.url)
  if (!urlInfo.ccode) {
    return {
      ok: false,
      error: 'URL에 ccode가 없습니다 — Request URL 전체를 복사했는지 확인해 주세요',
    }
  }

  // 2. JSON 파싱
  let parsed: Json
  try {
    parsed = JSON.parse(input.jsonText) as Json
  } catch {
    return {
      ok: false,
      error: 'JSON 형식이 아닙니다. Response 탭 내용을 그대로 복사해 주세요',
    }
  }

  // 3. 마스킹 → 4. 정규화 해시
  const payload = sanitizeWehagoPayload(parsed)
  const hash = contentHash(payload)

  // 5. 수임처 기본정보 → 회사 매핑 UPSERT
  if (urlInfo.screenCode === WEHAGO_SCREEN.COMPANY) {
    return upsertCompany(supabase, urlInfo.ccode, urlInfo.gisu, payload)
  }

  // 6. 그 외 화면 → 스냅샷 INSERT
  const { error } = await supabase.from('wehago_snapshots').insert({
    ccode: urlInfo.ccode,
    screen_code: urlInfo.screenCode,
    gisu: urlInfo.gisu,
    period_from: urlInfo.periodFrom,
    period_to: urlInfo.periodTo,
    content_hash: hash,
    payload,
    source: 'manual',
  })

  if (error) {
    // UNIQUE 충돌(23505) = 동일 데이터 → 정상 응답
    if (error.code === '23505') {
      return { ok: true, result: '변경 없음' }
    }
    return { ok: false, error: error.message }
  }

  return { ok: true, result: '신규 저장' }
}

/** sabc0102 payload(배열)에서 회사정보 추출 후 wehago_companies UPSERT + 거래처 매칭 */
async function upsertCompany(
  supabase: SupabaseServerClient,
  ccode: string,
  urlGisu: number | null,
  payload: Json,
): Promise<IngestResult> {
  const record = Array.isArray(payload) ? payload[0] : payload
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { ok: false, error: '수임처 기본정보 형식이 아닙니다.' }
  }

  const businessNumber = digitsOnly(record.no_biz)
  const companyName =
    typeof record.nm_krcom === 'string' ? record.nm_krcom : null
  const gisu =
    typeof record.danggi_gisu === 'number' ? record.danggi_gisu : urlGisu
  const accBegin = toDateString(record.da_accbegin)
  const accEnd = toDateString(record.da_accend)

  // 거래처 자동 매칭 — clients.business_number(하이픈 저장)와 숫자만 비교
  let clientId: string | null = null
  let matchedClientName: string | undefined
  let warning: string | undefined

  if (businessNumber) {
    const { data: matches } = await supabase
      .from('clients')
      .select('id, company_name')
      .in('business_number', businessNumberCandidates(businessNumber))

    if (matches && matches.length === 1) {
      clientId = matches[0].id
      matchedClientName = matches[0].company_name
    } else if (matches && matches.length > 1) {
      warning = `동일 사업자번호 거래처가 ${matches.length}건 — 자동 매칭 보류`
    } else {
      warning = '아톰베이스 거래처 미매칭'
    }
  } else {
    warning = '사업자번호 없음 — 거래처 미매칭'
  }

  const { error } = await supabase.from('wehago_companies').upsert(
    {
      ccode,
      business_number: businessNumber,
      company_name: companyName,
      client_id: clientId,
      gisu,
      acc_begin: accBegin,
      acc_end: accEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'ccode' },
  )

  if (error) {
    return { ok: false, error: error.message }
  }

  return {
    ok: true,
    result: '회사정보 갱신',
    companyName: companyName ?? undefined,
    matchedClientName,
    warning,
  }
}
