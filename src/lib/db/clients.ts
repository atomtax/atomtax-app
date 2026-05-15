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
