'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  calculateTransferIncome,
  calculateFilingDeadline,
} from '@/lib/calculators/property'
import type { TraderProperty } from '@/types/database'

export interface UpdatePropertyInput {
  transfer_amount?: number
  acquisition_date?: string | null
  transfer_date?: string | null
  location?: string | null
  prepaid_income_tax?: number
  prepaid_local_tax?: number
  is_85_over?: boolean
  comparison_taxation?: boolean
  progress_status?: TraderProperty['progress_status']
}

/** 새 물건 추가 — 자동으로 "물건N" 이름과 display_order 설정 */
export async function addProperty(clientId: string): Promise<{ id: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('trader_properties')
    .select('display_order')
    .eq('client_id', clientId)
    .order('display_order', { ascending: false })
    .limit(1)

  if (fetchError) throw new Error(fetchError.message)

  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1
  const nextName = `물건${nextOrder}`

  const { data, error } = await supabase
    .from('trader_properties')
    .insert({
      client_id: clientId,
      property_name: nextName,
      display_order: nextOrder,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/traders/${clientId}`)
  return { id: data.id }
}

/** 물건 정보 수정 (양도소득/신고기한 자동 계산 포함) */
export async function updateProperty(
  propertyId: string,
  input: UpdatePropertyInput,
): Promise<void> {
  const supabase = await createClient()

  const { data: current, error: fetchError } = await supabase
    .from('trader_properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (fetchError || !current) throw new Error('물건을 찾을 수 없습니다.')

  const merged = { ...current, ...input }

  const transfer_income = calculateTransferIncome(
    Number(merged.transfer_amount) || 0,
    Number(merged.acquisition_amount) || 0,
    Number(merged.other_expenses) || 0,
  )
  const filing_deadline = calculateFilingDeadline(merged.transfer_date)

  const { error } = await supabase
    .from('trader_properties')
    .update({
      ...input,
      transfer_income,
      filing_deadline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)

  if (error) throw new Error(error.message)

  revalidatePath(`/traders/${current.client_id}`)
}

/** 물건 삭제 (v20a에서는 UI 비활성, 함수만 준비) */
export async function deleteProperty(propertyId: string): Promise<void> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('trader_properties')
    .select('client_id')
    .eq('id', propertyId)
    .single()

  const clientId = data?.client_id as string | undefined

  const { error } = await supabase
    .from('trader_properties')
    .delete()
    .eq('id', propertyId)

  if (error) throw new Error(error.message)

  if (clientId) revalidatePath(`/traders/${clientId}`)
}
