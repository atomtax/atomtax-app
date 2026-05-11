import { createClient } from '@/lib/supabase/server'
import {
  TRADER_BUSINESS_CODES,
  type Client,
  type TraderProperty,
  type TraderPropertyExpense,
} from '@/types/database'

export interface TraderClientSummary {
  id: string
  company_name: string
  business_number: string | null
  representative: string | null
  manager: string | null
  trader_drive_folder_url: string | null
}

export interface TraderClientManagerGroup {
  manager: string
  clients: TraderClientSummary[]
}

/** 매매사업자 고객 목록 (담당자별로 그룹화) */
export async function listTraderClientsGroupedByManager(): Promise<TraderClientManagerGroup[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name, business_number, representative, manager, trader_drive_folder_url, business_category_code')
    .in('business_category_code', [...TRADER_BUSINESS_CODES])
    .eq('is_terminated', false)
    .order('manager', { ascending: true })
    .order('company_name', { ascending: true })

  if (error) throw new Error(error.message)
  if (!data) return []

  const map = new Map<string, TraderClientSummary[]>()
  for (const row of data) {
    const key = row.manager?.trim() || '담당자 미지정'
    const summary: TraderClientSummary = {
      id: row.id,
      company_name: row.company_name,
      business_number: row.business_number,
      representative: row.representative,
      manager: row.manager,
      trader_drive_folder_url: row.trader_drive_folder_url,
    }
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(summary)
  }

  return Array.from(map.entries()).map(([manager, clients]) => ({ manager, clients }))
}

/** 특정 사업자의 물건 목록 */
export async function listPropertiesByClient(clientId: string): Promise<TraderProperty[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trader_properties')
    .select('*')
    .eq('client_id', clientId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as TraderProperty[]
}

/** 특정 사업자의 클라이언트 정보 (회사명, 부동산 폴더 URL 등) */
export async function getTraderClient(clientId: string): Promise<Client | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) return null
  return data as Client
}

/**
 * 특정 물건의 필요경비 10행 로드
 * - DB에 저장된 행을 row_no 슬롯에 매핑
 * - 비어있는 슬롯은 기본값 객체로 채워 항상 길이 10인 배열 반환
 */
export async function listExpensesByProperty(
  propertyId: string,
): Promise<TraderPropertyExpense[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trader_property_expenses')
    .select('*')
    .eq('property_id', propertyId)
    .order('row_no', { ascending: true })

  if (error) throw new Error(error.message)

  const existing = (data ?? []) as TraderPropertyExpense[]
  const result: TraderPropertyExpense[] = []
  for (let i = 1; i <= 10; i++) {
    const match = existing.find((e) => e.row_no === i)
    if (match) {
      result.push(match)
    } else {
      result.push({
        id: '',
        property_id: propertyId,
        row_no: i,
        expense_name: null,
        category: '취득가액',
        amount: 0,
        predeclaration_allowed: true,
        income_tax_allowed: true,
        memo: null,
        created_at: '',
        updated_at: '',
      })
    }
  }

  return result
}
