/**
 * 마감 변화 감지 (Phase 7 재설계).
 *
 * 위하고 마감현황 응답(result_data[])을 받아 기장거래처로 한정하고,
 * 직전 관측값(closing_snapshots)과 str_6(마감시각)를 비교해 신규마감/재마감을
 * 감지한다. 현재 상태는 항상 closing_snapshots에 관측 이력으로 누적한다.
 *
 * 붙여넣기 호출과 (추후) 확장 버튼 호출이 공유하도록 supabase 클라이언트를 인자로 받음.
 */

import type { createClient } from '@/lib/supabase/server'
import type { ClosingResponseRow, ClosingTaxType, DetectSummary } from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function digitsOnly(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  return String(value).replace(/\D/g, '')
}

function trimStr(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** 응답 객체에서 result_data 행 배열 추출 (배열이 직접 와도 허용) */
function extractRows(json: unknown): ClosingResponseRow[] {
  if (Array.isArray(json)) return json as ClosingResponseRow[]
  if (json && typeof json === 'object') {
    const rd = (json as { result_data?: unknown }).result_data
    if (Array.isArray(rd)) return rd as ClosingResponseRow[]
  }
  return []
}

export interface DetectInput {
  json: unknown
  taxType: ClosingTaxType
}

export async function detectClosingChanges(
  supabase: SupabaseServerClient,
  input: DetectInput,
): Promise<DetectSummary> {
  const rows = extractRows(input.json)
  const taxType = input.taxType

  const summary: DetectSummary = {
    newClosed: 0,
    reClosed: 0,
    unchanged: 0,
    excluded: 0,
    events: [],
  }
  if (rows.length === 0) return summary

  // 1) 기장거래처 매핑 — clients 전체를 1회 조회해 숫자만 키로 맵 구성
  //    (clients.business_number는 하이픈 저장 → .or()/.in() 형식 이슈 회피)
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name, business_number')
    .eq('is_terminated', false)

  const clientByBiz = new Map<string, { id: string; company_name: string }>()
  for (const c of clients ?? []) {
    const d = digitsOnly(c.business_number)
    if (d) clientByBiz.set(d, { id: c.id, company_name: c.company_name })
  }

  // 2) 기장거래처에 해당하는 행만 정규화
  interface Norm {
    biz: string
    period: string | null
    company_name: string
    cno: string | null
    closedAt: string // str_6 (trim)
    manager: string | null
    clientId: string
  }
  const norms: Norm[] = []
  for (const r of rows) {
    const biz = digitsOnly(r.no_biz)
    if (!biz) continue
    const matched = clientByBiz.get(biz)
    if (!matched) {
      summary.excluded += 1
      continue
    }
    norms.push({
      biz,
      period: trimStr(r.da_period) || null,
      company_name: trimStr(r.nm_krcom) || matched.company_name,
      cno: trimStr(r.cno) || null,
      closedAt: trimStr(r.str_6),
      manager: trimStr(r.str_7) || null,
      clientId: matched.id,
    })
  }
  if (norms.length === 0) return summary

  // 3) 직전 관측값 일괄 조회 (N+1 방지) — biz 목록 + tax_type
  const bizList = Array.from(new Set(norms.map((n) => n.biz)))
  const { data: priors } = await supabase
    .from('closing_snapshots')
    .select('business_number, period, closed_at_raw, observed_at')
    .eq('tax_type', taxType)
    .in('business_number', bizList)
    .order('observed_at', { ascending: false })

  // (biz|period) → 가장 최근 closed_at_raw
  const priorMap = new Map<string, string>()
  for (const p of priors ?? []) {
    const key = `${p.business_number}|${p.period ?? ''}`
    if (!priorMap.has(key)) priorMap.set(key, trimStr(p.closed_at_raw))
  }

  // 4) 이벤트 판정 + 스냅샷/이벤트 배치 구성
  const nowIso = new Date().toISOString()
  const snapshotRows = norms.map((n) => ({
    business_number: n.biz,
    company_name: n.company_name,
    cno: n.cno,
    tax_type: taxType,
    period: n.period,
    is_closed: n.closedAt.length > 0,
    closed_at_raw: n.closedAt || null,
    manager: n.manager,
    client_id: n.clientId,
    observed_at: nowIso,
  }))

  const changeRows: Array<Record<string, unknown>> = []
  for (const n of norms) {
    const key = `${n.biz}|${n.period ?? ''}`
    const prev = priorMap.get(key) ?? ''
    const curr = n.closedAt

    if (curr.length === 0) {
      summary.unchanged += 1
      continue
    }
    if (prev.length === 0) {
      summary.newClosed += 1
      summary.events.push({
        company_name: n.company_name,
        change_type: 'new_closed',
        period: n.period,
      })
      changeRows.push({
        business_number: n.biz,
        company_name: n.company_name,
        tax_type: taxType,
        period: n.period,
        change_type: 'new_closed',
        prev_closed_at: null,
        curr_closed_at: curr,
        client_id: n.clientId,
      })
    } else if (prev !== curr) {
      summary.reClosed += 1
      summary.events.push({
        company_name: n.company_name,
        change_type: 're_closed',
        period: n.period,
      })
      changeRows.push({
        business_number: n.biz,
        company_name: n.company_name,
        tax_type: taxType,
        period: n.period,
        change_type: 're_closed',
        prev_closed_at: prev,
        curr_closed_at: curr,
        client_id: n.clientId,
      })
    } else {
      summary.unchanged += 1
    }
  }

  // 5) 저장 — 이벤트 먼저, 관측 스냅샷은 항상
  if (changeRows.length > 0) {
    await supabase.from('closing_changes').insert(changeRows)
  }
  await supabase.from('closing_snapshots').insert(snapshotRows)

  return summary
}
