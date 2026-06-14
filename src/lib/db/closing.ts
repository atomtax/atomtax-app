/**
 * 마감감지 + TP 매출 조회 (Phase 7 재설계). 서버 사이드 전용.
 */

import { createClient } from '@/lib/supabase/server'
import type {
  ClosingChange,
  TpSalesSnapshot,
  WehagoSnapshot,
} from '@/types/database'
import type { WehagoCompanyWithClient } from '@/lib/db/wehago'

function digits(value: string | null): string {
  return (value ?? '').replace(/\D/g, '')
}

/** 미확인(또는 전체) 마감 변화 이벤트 */
export async function fetchClosingChanges(
  includeReviewed = false,
): Promise<ClosingChange[]> {
  const supabase = await createClient()
  let query = supabase
    .from('closing_changes')
    .select('*')
    .order('detected_at', { ascending: false })
  if (!includeReviewed) query = query.eq('is_reviewed', false)

  const { data, error } = await query
  if (error || !data) return []
  return data as ClosingChange[]
}

export async function fetchClosingChangeById(
  id: string,
): Promise<ClosingChange | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('closing_changes')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return (data as ClosingChange) ?? null
}

/** 거래처(사업자번호)의 최신 TP 매출 스냅샷 */
export async function fetchLatestTpForBusiness(
  businessNumber: string,
): Promise<TpSalesSnapshot | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tp_sales_snapshots')
    .select('*')
    .eq('business_number', digits(businessNumber))
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as TpSalesSnapshot) ?? null
}

/** 1단계 위하고 스냅샷 재사용 — 사업자번호로 wehago_companies 매칭 후 스냅샷 */
export async function fetchWehagoByBusiness(
  businessNumber: string,
): Promise<{ company: WehagoCompanyWithClient; snapshots: WehagoSnapshot[] } | null> {
  const supabase = await createClient()
  const { data: companyRow } = await supabase
    .from('wehago_companies')
    .select('*, clients(company_name)')
    .eq('business_number', digits(businessNumber))
    .maybeSingle()

  if (!companyRow) return null

  const row = companyRow as WehagoCompanyWithClient & {
    ccode: string
    clients: { company_name: string } | null
  }
  const { clients, ...company } = row

  const { data: snaps } = await supabase
    .from('wehago_snapshots')
    .select('*')
    .eq('ccode', company.ccode)
    .order('collected_at', { ascending: false })

  return {
    company: { ...company, matched_client_name: clients?.company_name ?? null },
    snapshots: (snaps as WehagoSnapshot[]) ?? [],
  }
}
