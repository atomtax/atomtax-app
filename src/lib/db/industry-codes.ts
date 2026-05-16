'use server'

import { createClient } from '@/lib/supabase/server'

export interface IndustryCodeRow {
  industry_code: string
  mid_special_eligible?: 'O' | 'X' | null
  mid_special_note?: string | null
  startup_eligible?: 'O' | 'X' | null
  startup_start_date?: string | null
  startup_note?: string | null
  threshold_exceeded?: number | null
  threshold_below?: number | null
  min_employment?: number | null
  mid_special_category?: string | null
  small_biz_reduction_rate?: number | null
  category_major?: string | null
  category_major_name?: string | null
  business_description?: string | null
}

const BATCH_SIZE = 200

/**
 * 업종코드 마스터 일괄 upsert (PK: industry_code).
 * 대량 데이터(1,788건)이므로 200건씩 배치 처리.
 *
 * 같은 배치 내에 동일 industry_code가 두 번 이상 나오면
 * Postgres가 "ON CONFLICT DO UPDATE command cannot affect row a second time"
 * 에러로 배치 전체를 거부한다. 엑셀 원본(창감.xlsx)에 같은 업종코드가
 * 여러 번 등장하므로, upsert 전에 industry_code 기준으로 중복 제거.
 * (Map.set의 last-wins 동작 — 뒤에 나온 행이 앞 행을 덮어씀.)
 */
export async function bulkUpsertIndustryCodes(
  rows: IndustryCodeRow[],
): Promise<{ processed: number; duplicates: number; failed: number; errors: string[] }> {
  const supabase = await createClient()

  // 업종코드 기준 중복 제거 (last-wins)
  const uniqueMap = new Map<string, IndustryCodeRow>()
  for (const row of rows) {
    if (!row.industry_code) continue
    uniqueMap.set(row.industry_code, row)
  }
  const dedupedRows = Array.from(uniqueMap.values())
  const duplicates = rows.length - dedupedRows.length

  let processed = 0
  let failed = 0
  const errors: string[] = []

  for (let i = 0; i < dedupedRows.length; i += BATCH_SIZE) {
    const batch = dedupedRows.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase
      .from('industry_codes_master')
      .upsert(batch, { onConflict: 'industry_code' })
      .select('industry_code')

    if (error) {
      console.error(`[bulkUpsertIndustryCodes] 배치 ${i / BATCH_SIZE + 1} 실패:`, error.message)
      errors.push(`행 ${i + 1}~${i + batch.length}: ${error.message}`)
      failed += batch.length
    } else {
      processed += data?.length ?? 0
    }
  }

  return { processed, duplicates, failed, errors }
}

/** 업종코드 1건 조회 */
export async function getIndustryCode(
  industryCode: string,
): Promise<IndustryCodeRow | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('industry_codes_master')
    .select('*')
    .eq('industry_code', industryCode)
    .maybeSingle()
  return data
}

/**
 * 여러 업종코드 한꺼번에 조회 → Map 반환 (결산참고 페이지에서 N+1 방지).
 * .in() 사용 — PR #77 교훈(사업자번호 콤마 문제와 동일).
 */
export async function getIndustryCodes(
  codes: string[],
): Promise<Record<string, IndustryCodeRow>> {
  if (codes.length === 0) return {}
  const supabase = await createClient()
  const { data } = await supabase
    .from('industry_codes_master')
    .select('*')
    .in('industry_code', codes)

  const map: Record<string, IndustryCodeRow> = {}
  data?.forEach((row: IndustryCodeRow) => {
    map[row.industry_code] = row
  })
  return map
}
