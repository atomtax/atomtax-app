'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ParsedExpense,
  ParsedProperty,
} from '@/lib/excel/trader-upload-parser'
import {
  TRADER_BUSINESS_CODES,
  type TraderExpenseCategory,
} from '@/types/database'

export interface BulkUploadInput {
  properties: ParsedProperty[]
  expenses: ParsedExpense[]
}

export interface BulkUploadResult {
  ok: boolean
  registered: number
  skipped_duplicates: number
  unmatched_business_numbers: string[]
  non_trader_clients: string[]
  terminated_clients: string[]
  errors: string[]
}

interface ClientRow {
  id: string
  company_name: string
  business_number: string | null
  business_category_code: string | null
  is_terminated: boolean
}

interface ExistingPropertyRow {
  client_id: string
  acquisition_date: string | null
}

interface InsertedProperty {
  id: string
  client_id: string
}

const TRADER_CODES = TRADER_BUSINESS_CODES as readonly string[]

export async function bulkUploadTraderProperties(
  input: BulkUploadInput,
): Promise<BulkUploadResult> {
  const result: BulkUploadResult = {
    ok: true,
    registered: 0,
    skipped_duplicates: 0,
    unmatched_business_numbers: [],
    non_trader_clients: [],
    terminated_clients: [],
    errors: [],
  }

  if (input.properties.length === 0) {
    result.errors.push('업로드할 물건이 없습니다.')
    result.ok = false
    return result
  }

  const supabase = await createClient()

  // 1. 엑셀 사업자등록번호 수집 (이미 정규화됨: XXX-XX-XXXXX)
  const bizNumbers = Array.from(
    new Set(input.properties.map((p) => p.business_number)),
  )

  // 2. clients 조회 — business_number 형식이 DB에 따라 다를 수 있어
  //    하이픈 제거 후 JS에서 매칭 (안전)
  const { data: rawClients, error: clientsError } = await supabase
    .from('clients')
    .select(
      'id, company_name, business_number, business_category_code, is_terminated',
    )
    .eq('is_temporary', false)

  if (clientsError) {
    result.ok = false
    result.errors.push(`거래처 조회 실패: ${clientsError.message}`)
    return result
  }

  const clients = (rawClients ?? []) as ClientRow[]
  const clientByDigits = new Map<string, ClientRow>()
  for (const c of clients) {
    const digits = (c.business_number ?? '').replace(/\D/g, '')
    if (digits.length === 10) clientByDigits.set(digits, c)
  }

  // 3. 매칭 결과 분류
  const matchedClientByBizNum = new Map<string, ClientRow>()
  for (const bizNum of bizNumbers) {
    const digits = bizNum.replace(/\D/g, '')
    const client = clientByDigits.get(digits)
    if (!client) {
      result.unmatched_business_numbers.push(bizNum)
      continue
    }
    if (!TRADER_CODES.includes(client.business_category_code ?? '')) {
      result.non_trader_clients.push(`${client.company_name} (${bizNum})`)
      continue
    }
    if (client.is_terminated) {
      result.terminated_clients.push(`${client.company_name} (${bizNum})`)
      continue
    }
    matchedClientByBizNum.set(bizNum, client)
  }

  if (matchedClientByBizNum.size === 0) {
    // 처리할 게 없으면 그대로 반환 (errors는 0이지만 reigsterd=0)
    return result
  }

  // 4. 중복 체크용 기존 trader_properties 조회 ((client_id, acquisition_date) 키)
  const matchedClientIds = Array.from(matchedClientByBizNum.values()).map(
    (c) => c.id,
  )
  const { data: existingProps, error: existingError } = await supabase
    .from('trader_properties')
    .select('client_id, acquisition_date')
    .in('client_id', matchedClientIds)

  if (existingError) {
    result.ok = false
    result.errors.push(`기존 물건 조회 실패: ${existingError.message}`)
    return result
  }

  const existingKeys = new Set<string>()
  for (const row of (existingProps ?? []) as ExistingPropertyRow[]) {
    if (row.acquisition_date) {
      existingKeys.add(`${row.client_id}__${row.acquisition_date}`)
    }
  }

  // 5. 물건 1건씩 INSERT + 매칭되는 expenses INSERT
  // 트랜잭션 미사용 (실패 시 부분 등록은 결과 리포트에 표시).
  for (const property of input.properties) {
    const client = matchedClientByBizNum.get(property.business_number)
    if (!client) continue

    const key = `${client.id}__${property.acquisition_date}`
    if (existingKeys.has(key)) {
      result.skipped_duplicates += 1
      continue
    }

    // 5-1. trader_properties INSERT
    // 주소는 location 필드에 매핑. 물건종류 컬럼이 없어 property_name 끝에 메모로 추가하지 않음
    // (사용자가 다시 편집 시 혼선 방지). 필요 시 후속 작업에서 컬럼 추가.
    const propertyRow = {
      client_id: client.id,
      property_name: property.property_name,
      location: property.location || null,
      acquisition_date: property.acquisition_date,
      transfer_date: property.transfer_date,
      transfer_amount: property.transfer_amount,
      prepaid_income_tax: property.prepaid_income_tax,
      prepaid_local_tax: property.prepaid_local_tax,
      progress_status: '미확인',
    }

    const { data: inserted, error: insertError } = await supabase
      .from('trader_properties')
      .insert(propertyRow)
      .select('id, client_id')
      .single<InsertedProperty>()

    if (insertError || !inserted) {
      result.errors.push(
        `${client.company_name} - ${property.property_name}: ${insertError?.message ?? '등록 실패'}`,
      )
      continue
    }

    // 5-2. 매칭되는 필요경비 INSERT
    const matchingExpenses = input.expenses.filter(
      (e) =>
        e.business_number === property.business_number &&
        e.property_name === property.property_name,
    )

    if (matchingExpenses.length > 0) {
      const expenseRows = matchingExpenses.map((e) => ({
        property_id: inserted.id,
        row_no: e.row_no,
        expense_name: e.expense_name,
        amount: e.amount,
        predeclaration_allowed: e.predeclaration_allowed,
        income_tax_allowed: e.income_tax_allowed,
        category: e.category satisfies TraderExpenseCategory,
      }))

      const { error: expError } = await supabase
        .from('trader_property_expenses')
        .insert(expenseRows)

      if (expError) {
        result.errors.push(
          `${client.company_name} - ${property.property_name} 필요경비 등록 실패: ${expError.message}`,
        )
      }
    }

    result.registered += 1
    existingKeys.add(key)
  }

  revalidatePath('/traders')
  return result
}
