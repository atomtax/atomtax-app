/**
 * 위하고 수집 데이터 조회 (Phase 7 / 1단계)
 * 모든 DB 접근은 서버 사이드에서만.
 */

import { createClient } from '@/lib/supabase/server'
import type { WehagoCompany, WehagoSnapshot } from '@/types/database'

export interface WehagoCompanyWithClient extends WehagoCompany {
  matched_client_name: string | null
}

/** 화면코드별 최신 collected_at (목록 표시용) */
export interface SnapshotMeta {
  ccode: string
  screen_code: string
  collected_at: string
}

/** 수집 회사 목록 (매칭 거래처명 포함) */
export async function fetchWehagoCompanies(): Promise<WehagoCompanyWithClient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wehago_companies')
    .select('*, clients(company_name)')
    .order('updated_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => {
    const { clients, ...company } = row as WehagoCompany & {
      clients: { company_name: string } | null
    }
    return {
      ...company,
      matched_client_name: clients?.company_name ?? null,
    }
  })
}

/** 전체 스냅샷 메타 (payload 제외) — 목록의 화면별 최신 수집일 계산용 */
export async function fetchSnapshotMeta(): Promise<SnapshotMeta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wehago_snapshots')
    .select('ccode, screen_code, collected_at')
    .order('collected_at', { ascending: false })

  if (error || !data) return []
  return data as SnapshotMeta[]
}

/** 특정 회사의 스냅샷 전체 (payload 포함, 최신순) */
export async function fetchSnapshotsForCompany(
  ccode: string,
): Promise<WehagoSnapshot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wehago_snapshots')
    .select('*')
    .eq('ccode', ccode)
    .order('collected_at', { ascending: false })

  if (error || !data) return []
  return data as WehagoSnapshot[]
}
