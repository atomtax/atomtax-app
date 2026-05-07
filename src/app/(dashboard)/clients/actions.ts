'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Client, ClientInsert, ClientUpdate } from '@/types/database'
import {
  formatPhoneNumber,
  formatBusinessNumberForSave,
  formatResidentNumber,
  formatCorporateNumber,
} from '@/lib/utils/format-phone'

function normalizeClientFields<T extends Partial<ClientInsert>>(data: T): T {
  return {
    ...data,
    phone: data.phone ? formatPhoneNumber(data.phone) || data.phone : data.phone,
    business_number: data.business_number
      ? formatBusinessNumberForSave(data.business_number) || data.business_number
      : data.business_number,
    resident_number: data.resident_number
      ? formatResidentNumber(data.resident_number) || data.resident_number
      : data.resident_number,
    corporate_number: data.corporate_number
      ? formatCorporateNumber(data.corporate_number) || data.corporate_number
      : data.corporate_number,
  }
}

/** 활성 고객 중 최대 번호 + 1 반환 */
export async function getNextClientNumberAction(): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('number')
    .eq('is_terminated', false)
    .not('number', 'is', null)
  const max = (data ?? []).reduce((acc, r) => {
    const n = parseInt(r.number ?? '0')
    return n > acc ? n : acc
  }, 0)
  return String(max + 1)
}

export async function createClientAction(data: ClientInsert): Promise<Client> {
  const supabase = await createClient()
  let number = data.number
  if (!number) {
    number = await getNextClientNumberAction()
  }
  const { data: created, error } = await supabase
    .from('clients')
    .insert({ ...normalizeClientFields(data), number })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  return created as Client
}

export async function updateClientAction(id: string, data: ClientUpdate): Promise<Client> {
  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('clients')
    .update({ ...normalizeClientFields(data), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  revalidatePath('/clients/terminated')
  return updated as Client
}

export async function deleteClientAction(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  revalidatePath('/clients/terminated')
}

export async function terminateClientAction(id: string, terminationDate: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({
      is_terminated: true,
      termination_date: terminationDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  revalidatePath('/clients/terminated')
}

/** 해임 복원 — 번호 충돌 시 새 번호 자동 부여 */
export async function restoreClientAction(id: string): Promise<{ number: string }> {
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('number')
    .eq('id', id)
    .single()
  if (!client) throw new Error('고객을 찾을 수 없습니다.')

  let newNumber = client.number as string | null
  if (newNumber) {
    const { data: collision } = await supabase
      .from('clients')
      .select('id')
      .eq('number', newNumber)
      .eq('is_terminated', false)
      .maybeSingle()
    if (collision) newNumber = await getNextClientNumberAction()
  } else {
    newNumber = await getNextClientNumberAction()
  }

  const { error } = await supabase
    .from('clients')
    .update({
      is_terminated: false,
      termination_date: null,
      number: newNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  revalidatePath('/clients/terminated')
  return { number: newNumber }
}

/** 엑셀 업로드 — 사업자번호 기준 upsert */
export async function saveClientsBatchAction(
  rows: Array<Partial<ClientInsert> & { id?: string }>
): Promise<{ created: number; updated: number }> {
  const supabase = await createClient()
  let created = 0
  let updated = 0

  for (const row of rows) {
    if (row.id) {
      const { id, ...rest } = row
      const { error } = await supabase
        .from('clients')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
      updated++
    } else {
      let number = row.number
      if (!number) number = await getNextClientNumberAction()
      const { error } = await supabase
        .from('clients')
        .insert({ ...row, number })
      if (error) throw new Error(error.message)
      created++
    }
  }

  revalidatePath('/clients')
  return { created, updated }
}
