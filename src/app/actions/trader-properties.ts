'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  calculateTransferIncome,
  calculateFilingDeadline,
  aggregateExpenses,
} from '@/lib/calculators/property'
import { listExpensesByProperty } from '@/lib/db/trader-properties'
import type {
  TraderExpenseCategory,
  TraderProperty,
  TraderPropertyExpense,
} from '@/types/database'

export interface UpdatePropertyInput {
  property_name?: string
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

/** 필요경비 10행 조회 (Client Component에서 호출용 래퍼) */
export async function getExpenses(propertyId: string): Promise<TraderPropertyExpense[]> {
  return listExpensesByProperty(propertyId)
}

export interface SaveExpenseRowInput {
  row_no: number
  expense_name: string | null
  category: TraderExpenseCategory
  amount: number
  predeclaration_allowed: boolean
  income_tax_allowed: boolean
  memo: string | null
}

/**
 * 필요경비 10행 저장 + 물건 마스터의 acquisition_amount/other_expenses 자동 합산
 * 1) 기존 필요경비 행 전체 삭제 → 비용명/금액이 채워진 행만 INSERT
 * 2) aggregateExpenses로 합산 (예정신고=true 항목만, category별)
 * 3) 양도소득 재계산 (transfer_amount - acquisition_amount - other_expenses)
 * 4) trader_properties 업데이트
 */
export async function saveExpenses(
  propertyId: string,
  rows: SaveExpenseRowInput[],
): Promise<void> {
  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('trader_property_expenses')
    .delete()
    .eq('property_id', propertyId)

  if (deleteError) throw new Error(deleteError.message)

  const toInsert = rows
    .filter((r) => (r.expense_name && r.expense_name.trim() !== '') || r.amount > 0)
    .map((r) => ({
      property_id: propertyId,
      row_no: r.row_no,
      expense_name: r.expense_name,
      category: r.category,
      amount: r.amount,
      predeclaration_allowed: r.predeclaration_allowed,
      income_tax_allowed: r.income_tax_allowed,
      memo: r.memo,
    }))

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('trader_property_expenses')
      .insert(toInsert)

    if (insertError) throw new Error(insertError.message)
  }

  const { acquisition_amount, other_expenses } = aggregateExpenses(
    rows.map((r) => ({
      category: r.category,
      amount: r.amount,
      predeclaration_allowed: r.predeclaration_allowed,
    })),
  )

  const { data: propertyRow, error: fetchError } = await supabase
    .from('trader_properties')
    .select('transfer_amount, client_id')
    .eq('id', propertyId)
    .single()

  if (fetchError || !propertyRow) throw new Error('물건을 찾을 수 없습니다.')

  const transferAmount = Number(propertyRow.transfer_amount) || 0
  const transferIncome = calculateTransferIncome(
    transferAmount,
    acquisition_amount,
    other_expenses,
  )

  const { error: updateError } = await supabase
    .from('trader_properties')
    .update({
      acquisition_amount,
      other_expenses,
      transfer_income: transferIncome,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)

  if (updateError) throw new Error(updateError.message)

  if (propertyRow.client_id) {
    revalidatePath(`/traders/${propertyRow.client_id}`)
  }
}

export interface SavePropertyMeta {
  property_name?: string
  location?: string | null
  prepaid_income_tax?: number
  prepaid_local_tax?: number
  is_85_over?: boolean
  comparison_taxation?: boolean
  progress_status?: TraderProperty['progress_status']
  transfer_amount?: number
  acquisition_date?: string | null
  transfer_date?: string | null
}

/**
 * 물건 메타 정보 + 필요경비 10행을 한 번에 저장.
 * - 필요경비 합산 → acquisition_amount/other_expenses 자동 업데이트
 * - transfer_income 재계산
 * - filing_deadline 재계산 (transfer_date 기준)
 */
export async function saveExpensesAndProperty(
  propertyId: string,
  meta: SavePropertyMeta,
  expenses: SaveExpenseRowInput[],
): Promise<void> {
  const supabase = await createClient()

  // 1) 기존 필요경비 삭제 후 재삽입
  const { error: deleteError } = await supabase
    .from('trader_property_expenses')
    .delete()
    .eq('property_id', propertyId)

  if (deleteError) throw new Error(deleteError.message)

  const toInsert = expenses
    .filter((r) => (r.expense_name && r.expense_name.trim() !== '') || r.amount > 0)
    .map((r) => ({
      property_id: propertyId,
      row_no: r.row_no,
      expense_name: r.expense_name,
      category: r.category,
      amount: r.amount,
      predeclaration_allowed: r.predeclaration_allowed,
      income_tax_allowed: r.income_tax_allowed,
      memo: r.memo,
    }))

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('trader_property_expenses')
      .insert(toInsert)
    if (insertError) throw new Error(insertError.message)
  }

  // 2) 필요경비 합산 + 양도소득/신고기한 재계산
  const { acquisition_amount, other_expenses } = aggregateExpenses(
    expenses.map((r) => ({
      category: r.category,
      amount: r.amount,
      predeclaration_allowed: r.predeclaration_allowed,
    })),
  )
  const transferAmount = Number(meta.transfer_amount) || 0
  const transfer_income = calculateTransferIncome(
    transferAmount,
    acquisition_amount,
    other_expenses,
  )
  const filing_deadline = calculateFilingDeadline(meta.transfer_date ?? null)

  // 3) 물건 마스터 업데이트
  const { data, error: updateError } = await supabase
    .from('trader_properties')
    .update({
      ...meta,
      acquisition_amount,
      other_expenses,
      transfer_income,
      filing_deadline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .select('client_id')
    .single()

  if (updateError) throw new Error(updateError.message)

  if (data?.client_id) {
    revalidatePath(`/traders/${data.client_id}`)
  }
}

/** 물건 삭제 (v20ac에서 실제 동작) */
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
