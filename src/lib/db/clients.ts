'use server'

import { createClient } from '@/lib/supabase/server'
import type { Client, ClientInsert, ClientUpdate } from '@/types/database'

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_terminated', false)
    .eq('is_temporary', false)
    .order('number', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listClients(opts?: {
  businessTypeCategory?: '법인' | '개인'
}): Promise<Client[]> {
  const supabase = await createClient()
  let query = supabase
    .from('clients')
    .select('*')
    .eq('is_terminated', false)
    .eq('is_temporary', false)
    .order('company_name')
  if (opts?.businessTypeCategory) {
    query = query.eq('business_type_category', opts.businessTypeCategory)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getTerminatedClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_terminated', true)
    .eq('is_temporary', false)
    .order('termination_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createClient_(client: ClientInsert): Promise<Client> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateClient(id: string, client: ClientUpdate): Promise<Client> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .update({ ...client, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function terminateClient(id: string, terminationDate: string): Promise<Client> {
  return updateClient(id, {
    is_terminated: true,
    termination_date: terminationDate,
  })
}

export interface TemporaryClientData {
  company_name: string
  business_number?: string
  business_type_category?: '개인' | '법인'
  manager?: string
}

/**
 * 임시(일회성) 고객 추가.
 * - is_temporary = true 강제 설정 (호출자가 변경 불가)
 * - is_terminated = false (활성 상태)
 * - 정식 고객 목록에서 숨김. 종합소득세 보고서 등 보고서 작성용으로 사용.
 */
export async function addTemporaryClient(
  data: TemporaryClientData,
): Promise<{ id: string; company_name: string }> {
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      company_name: data.company_name,
      business_number: data.business_number ?? null,
      business_type_category: data.business_type_category ?? '개인',
      manager: data.manager ?? null,
      is_temporary: true,
      is_terminated: false,
    })
    .select('id, company_name')
    .single()

  if (error) throw new Error(`임시 고객 추가 실패: ${error.message}`)
  return client
}

/**
 * 기존 등록된 담당자 목록 (distinct, 가나다 순).
 * 임시 고객 모달의 담당자 드롭다운에 사용. 정식·임시 고객 모두 포함.
 */
export async function getManagerList(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('manager')
    .not('manager', 'is', null)
    .neq('manager', '')

  if (error) {
    console.error('담당자 목록 조회 실패:', error)
    return []
  }

  const set = new Set<string>()
  for (const row of data ?? []) {
    const m = row.manager?.trim()
    if (m) set.add(m)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
}

/**
 * 임시 고객 삭제.
 * - is_temporary = true 인 경우만 삭제 가능 (이중 안전장치)
 * - 연결된 보고서·공유링크도 함께 정리 (FK CASCADE 의존 X)
 * - 정식 고객은 어떤 경우에도 이 함수로 삭제 불가
 */
export async function deleteTemporaryClient(clientId: string): Promise<void> {
  const supabase = await createClient()

  // 1. 안전장치 — 임시 고객인지 확인
  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('id, is_temporary')
    .eq('id', clientId)
    .maybeSingle()

  if (fetchError) throw new Error(`고객 조회 실패: ${fetchError.message}`)
  if (!client) throw new Error('해당 고객을 찾을 수 없습니다.')
  if (!client.is_temporary) {
    throw new Error('정식 고객은 이 기능으로 삭제할 수 없습니다.')
  }

  // 2. 연결된 보고서 삭제 (향후 corporate_tax_reports, vat_reports 등 추가 시 함께 정리)
  await supabase.from('income_tax_reports').delete().eq('client_id', clientId)

  // 3. 공유 링크 삭제 (PR #62 — report_share_links)
  await supabase.from('report_share_links').delete().eq('client_id', clientId)

  // 4. 클라이언트 삭제 (이중 안전장치: is_temporary = true 조건)
  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('is_temporary', true)

  if (deleteError) throw new Error(`삭제 실패: ${deleteError.message}`)
}

/**
 * 사업자번호 → 개업일 일괄 업데이트.
 * 엑셀 사업자번호는 하이픈 유무 혼재 가능 — 하이픈 제거 + 원본 두 형식 모두 매칭.
 * 임시 고객은 제외.
 */
export async function bulkUpdateOpeningDates(
  updates: Array<{ business_number: string; opening_date: string }>,
): Promise<{ updated: number; notFound: string[] }> {
  const supabase = await createClient()
  const notFound: string[] = []
  let updated = 0

  for (const { business_number, opening_date } of updates) {
    const original = business_number.trim()
    const digitsOnly = original.replace(/\D/g, '')

    // 저장 시 3-2-5 포맷(`formatBusinessNumberForSave`)으로 정규화되므로 hyphen 포맷도 후보에 포함.
    const hyphenated =
      digitsOnly.length === 10
        ? `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 5)}-${digitsOnly.slice(5)}`
        : null

    const candidates = Array.from(
      new Set([original, digitsOnly, hyphenated].filter((v): v is string => !!v)),
    )

    // .or() 는 값에 쉼표·점이 포함되면 파싱이 깨질 수 있어 .in()을 사용.
    const { data, error } = await supabase
      .from('clients')
      .update({ opening_date, updated_at: new Date().toISOString() })
      .in('business_number', candidates)
      .eq('is_temporary', false)
      .select('id')

    if (error) {
      console.error(`[bulkUpdateOpeningDates] ${original} 업데이트 실패:`, error.message)
      notFound.push(original)
    } else if (!data || data.length === 0) {
      notFound.push(original)
    } else {
      updated += data.length
    }
  }

  return { updated, notFound }
}
