import { createClient } from '@/lib/supabase/server'
import { TRADER_BUSINESS_CODES, type TraderProperty } from '@/types/database'
import type {
  ChecklistClient,
  ChecklistFilterOptions,
  ChecklistRowData,
} from '@/app/(dashboard)/traders/checklist/types'

interface RawPropertyWithClient extends TraderProperty {
  client: ChecklistClient | null
}

/**
 * 매매사업자 체크리스트 전체 데이터 (JOIN)
 * - 업종코드 703011, 703012 사업자에 한정
 * - 해지 고객 제외
 * - filing_deadline 오름차순
 */
export async function getChecklistData(): Promise<ChecklistRowData[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trader_properties')
    .select(
      `*,
       client:clients!inner(
         id, company_name, manager, business_number, trader_drive_folder_url,
         business_category_code, is_terminated
       )`,
    )
    .in('client.business_category_code', [...TRADER_BUSINESS_CODES])
    .eq('client.is_terminated', false)
    .order('filing_deadline', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  if (!data) return []

  const rows: ChecklistRowData[] = []
  for (const raw of data as RawPropertyWithClient[]) {
    if (!raw.client) continue
    const { client, ...property } = raw
    rows.push({
      property: property as TraderProperty,
      client: {
        id: client.id,
        company_name: client.company_name,
        manager: client.manager,
        business_number: client.business_number,
        trader_drive_folder_url: client.trader_drive_folder_url,
      },
    })
  }

  return rows
}

/**
 * 필터 옵션 (담당자 distinct + 년월 범위)
 * - 담당자: 업종코드 703011/703012 사업자의 manager distinct
 * - 년월: 오늘 기준 ±24개월 (DB 데이터와 무관하게 안정적)
 */
export async function getChecklistFilterOptions(): Promise<ChecklistFilterOptions> {
  const supabase = await createClient()

  const { data: clients, error } = await supabase
    .from('clients')
    .select('manager')
    .in('business_category_code', [...TRADER_BUSINESS_CODES])
    .eq('is_terminated', false)

  if (error) throw new Error(error.message)

  const managerSet = new Set<string>()
  for (const row of clients ?? []) {
    const m = row.manager?.trim()
    if (m) managerSet.add(m)
  }
  const managers = Array.from(managerSet).sort()

  // 오늘 기준 24개월 전 ~ 12개월 후
  const today = new Date()
  const yearMonths: string[] = []
  for (let offset = -24; offset <= 12; offset++) {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    yearMonths.push(ym)
  }

  return { managers, yearMonths }
}
