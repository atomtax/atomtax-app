'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  calculateTransferIncome,
  calculateFilingDeadline,
  aggregateExpenses,
} from '@/lib/calculators/property'
import { calculateIncomeTax } from '@/lib/calculators/income-tax'
import { listExpensesByProperty } from '@/lib/db/trader-properties'
import type {
  TraderExpenseCategory,
  TraderProperty,
  TraderPropertyExpense,
} from '@/types/database'

export interface UpdatePropertyInput {
  property_name?: string
  property_type?: string | null
  transfer_amount?: number
  vat_amount?: number
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
    Number(merged.vat_amount) || 0,
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
    .select('transfer_amount, vat_amount, client_id')
    .eq('id', propertyId)
    .single()

  if (fetchError || !propertyRow) throw new Error('물건을 찾을 수 없습니다.')

  const transferAmount = Number(propertyRow.transfer_amount) || 0
  const vatAmount = Number(propertyRow.vat_amount) || 0
  const transferIncome = calculateTransferIncome(
    transferAmount,
    vatAmount,
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
  property_type?: string | null
  location?: string | null
  prepaid_income_tax?: number
  prepaid_local_tax?: number
  is_85_over?: boolean
  comparison_taxation?: boolean
  progress_status?: TraderProperty['progress_status']
  transfer_amount?: number
  vat_amount?: number
  acquisition_date?: string | null
  transfer_date?: string | null
  land_area?: number
  building_area?: number
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
  const vatAmount = Number(meta.vat_amount) || 0
  const transfer_income = calculateTransferIncome(
    transferAmount,
    vatAmount,
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

export interface PriorAmounts {
  priorTransferIncome: number
  priorPrepaidIncomeTax: number
  priorPrepaidLocalTax: number
  priorPropertiesCount: number
  priorPropertyNames: string[]
  /** override가 적용된 최종값. UI 표시용. */
  effectivePriorTransferIncome: number
  isOverridden: boolean
}

/**
 * 종전 양도차익 / 기납부세액 자동계산
 * - 같은 거래처(client_id)
 * - 같은 양도년도(YEAR(transfer_date))
 * - 양도일이 이번 물건보다 빠른 물건만
 * - 이번 물건은 제외
 *
 * 🛡️ 단방향 원칙: 읽기 전용 SELECT만. 다른 물건의 DB 행을 절대 수정하지 않음.
 */
export async function calculatePriorAmounts(
  propertyId: string,
): Promise<PriorAmounts> {
  const supabase = await createClient()

  const { data: current, error: fetchError } = await supabase
    .from('trader_properties')
    .select('client_id, transfer_date, prior_transfer_income_override')
    .eq('id', propertyId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!current) return emptyPriorAmounts()

  const override =
    current.prior_transfer_income_override !== null &&
    current.prior_transfer_income_override !== undefined
      ? Number(current.prior_transfer_income_override)
      : null
  const isOverridden = override !== null

  if (!current.transfer_date) {
    return {
      ...emptyPriorAmounts(),
      effectivePriorTransferIncome: override ?? 0,
      isOverridden,
    }
  }

  const transferYear = new Date(current.transfer_date).getFullYear()
  const yearStart = `${transferYear}-01-01`
  const yearEnd = `${transferYear}-12-31`

  const { data: priorProperties, error: priorError } = await supabase
    .from('trader_properties')
    .select('id, property_name, transfer_income, prepaid_income_tax, prepaid_local_tax')
    .eq('client_id', current.client_id)
    .neq('id', propertyId)
    .gte('transfer_date', yearStart)
    .lte('transfer_date', yearEnd)
    .lt('transfer_date', current.transfer_date)
    .order('transfer_date', { ascending: true })

  if (priorError) throw new Error(priorError.message)
  const list = priorProperties ?? []

  let priorTransferIncome = 0
  let priorPrepaidIncomeTax = 0
  let priorPrepaidLocalTax = 0
  const names: string[] = []

  for (const p of list) {
    priorTransferIncome += Number(p.transfer_income ?? 0)
    priorPrepaidIncomeTax += Number(p.prepaid_income_tax ?? 0)
    priorPrepaidLocalTax += Number(p.prepaid_local_tax ?? 0)
    names.push(p.property_name)
  }

  return {
    priorTransferIncome,
    priorPrepaidIncomeTax,
    priorPrepaidLocalTax,
    priorPropertiesCount: list.length,
    priorPropertyNames: names,
    effectivePriorTransferIncome: override ?? priorTransferIncome,
    isOverridden,
  }
}

function emptyPriorAmounts(): PriorAmounts {
  return {
    priorTransferIncome: 0,
    priorPrepaidIncomeTax: 0,
    priorPrepaidLocalTax: 0,
    priorPropertiesCount: 0,
    priorPropertyNames: [],
    effectivePriorTransferIncome: 0,
    isOverridden: false,
  }
}

/** 종전 양도차익 수동 수정값 저장. NULL이면 자동값 복귀. */
export async function updatePriorTransferIncomeOverride(
  propertyId: string,
  value: number | null,
): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_properties')
    .update({ prior_transfer_income_override: value })
    .eq('id', propertyId)
    .select('client_id')
    .single()

  if (error) throw new Error(`종전 양도차익 저장 실패: ${error.message}`)
  if (data?.client_id) revalidatePath(`/traders/${data.client_id}`)
}

export interface CalculatePropertyTaxResult {
  income_tax: number
  local_tax: number
  prior: PriorAmounts
  combined_transfer_income: number
  applied_rate_percent: number
  total_tax: number
}

/**
 * 세금계산 — 동일 년도 종전 양도차익 합산 반영.
 *
 * 산식:
 *   합산 양도차익 = 이번 양도차익 + 종전 양도차익(override 우선)
 *   산출세액 = bracket(합산 양도차익)
 *   이번 물건 종소세 = 산출세액 - 종전 기납부 종소세
 *   이번 물건 지방세 = 이번 물건 종소세 × 10%
 *
 * 🛡️ 단방향: 이 함수가 수정하는 행은 propertyId 한 행뿐. 종전 물건은 읽기만.
 */
export async function calculatePropertyTax(
  propertyId: string,
): Promise<CalculatePropertyTaxResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('trader_properties')
    .select('transfer_income')
    .eq('id', propertyId)
    .single()

  if (error || !data) throw new Error('물건을 찾을 수 없습니다.')

  const prior = await calculatePriorAmounts(propertyId)
  const transferIncome = Number(data.transfer_income) || 0
  const combinedIncome = transferIncome + prior.effectivePriorTransferIncome

  let totalTax = 0
  let appliedRate = 0
  if (combinedIncome > 0) {
    const bracket = calculateIncomeTax(combinedIncome)
    totalTax = bracket.tax
    appliedRate = bracket.rate
  }
  const thisIncomeTax = Math.max(0, totalTax - prior.priorPrepaidIncomeTax)
  const thisLocalTax = Math.floor(thisIncomeTax * 0.1)

  const { error: updateError } = await supabase
    .from('trader_properties')
    .update({
      prepaid_income_tax: thisIncomeTax,
      prepaid_local_tax: thisLocalTax,
    })
    .eq('id', propertyId)

  if (updateError) throw new Error(updateError.message)

  return {
    income_tax: thisIncomeTax,
    local_tax: thisLocalTax,
    prior,
    combined_transfer_income: combinedIncome,
    applied_rate_percent: appliedRate,
    total_tax: totalTax,
  }
}
