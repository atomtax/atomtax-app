import 'server-only'

import { createClient } from '@/lib/supabase/server'

const TRADER_CATEGORY_CODES = ['703011', '703012']

export interface TraderReviewProperty {
  id: string
  property_name: string
  acquisition_date: string | null
  transfer_date: string | null
  transfer_amount: number
  acquisition_cost: number
  prepaid_income_tax: number
  prepaid_local_tax: number
  is_transferred_in_year: boolean
  is_in_inventory: boolean
}

export interface TraderReviewRow {
  client_id: string
  company_name: string
  manager: string
  business_item: string
  business_category_code: string

  total_revenue: number
  total_cogs: number
  ending_inventory: number
  total_income_tax: number
  total_local_tax: number

  properties: TraderReviewProperty[]

  memo: string
  is_confirmed: boolean
}

interface ClientRow {
  id: string
  company_name: string
  manager: string | null
  business_item: string | null
  business_category_code: string | null
}

interface ExpenseRow {
  amount: number | string | null
  category: string | null
  predeclaration_allowed: boolean | null
}

interface PropertyRow {
  id: string
  client_id: string
  property_name: string
  acquisition_date: string | null
  transfer_date: string | null
  transfer_amount: number | string | null
  prepaid_income_tax: number | string | null
  prepaid_local_tax: number | string | null
  trader_property_expenses: ExpenseRow[] | null
}

interface NoteRow {
  client_id: string
  memo: string
  is_confirmed: boolean
}

/**
 * 매매사업자 결산참고 데이터 조회.
 *
 * 집계 정책:
 * - 매출액 = 선택 연도에 양도된 물건의 transfer_amount 합계
 * - 매출원가 = 선택 연도 양도 물건의 취득가액(필요경비 중 category='취득가액',
 *   predeclaration_allowed=true) 합계
 * - 기말재고 = 취득일 ≤ 연말 + (양도일 없음 또는 ≥ 차년도) 물건의 취득가액 합계
 * - 종소세/지방세 = 양도 물건의 기납부 종소세/지방세 합계
 */
export async function getTraderReviewData(params: {
  year: number
  manager?: string
}): Promise<TraderReviewRow[]> {
  const supabase = await createClient()

  const yearStart = `${params.year}-01-01`
  const yearEnd = `${params.year}-12-31`
  const nextYearStart = `${params.year + 1}-01-01`

  let clientQuery = supabase
    .from('clients')
    .select('id, company_name, manager, business_item, business_category_code')
    .in('business_category_code', TRADER_CATEGORY_CODES)
    .eq('is_terminated', false)
    .eq('is_temporary', false)
    .order('manager', { ascending: true, nullsFirst: false })
    .order('company_name', { ascending: true })

  if (params.manager) {
    clientQuery = clientQuery.eq('manager', params.manager)
  }

  const { data: clients, error: clientsError } = await clientQuery
  if (clientsError) {
    throw new Error(`매매사업자 조회 실패: ${clientsError.message}`)
  }
  if (!clients || clients.length === 0) return []

  const clientIds = (clients as ClientRow[]).map((c) => c.id)

  const { data: properties, error: propsError } = await supabase
    .from('trader_properties')
    .select(
      `id, client_id, property_name, acquisition_date, transfer_date,
       transfer_amount, prepaid_income_tax, prepaid_local_tax,
       trader_property_expenses(amount, category, predeclaration_allowed)`,
    )
    .in('client_id', clientIds)
    .order('acquisition_date', { ascending: true, nullsFirst: false })

  if (propsError) {
    throw new Error(`매매사업자 물건 조회 실패: ${propsError.message}`)
  }

  let notes: NoteRow[] = []
  const { data: notesData, error: notesError } = await supabase
    .from('trader_review_notes')
    .select('client_id, memo, is_confirmed')
    .in('client_id', clientIds)
    .eq('report_year', params.year)

  if (notesError) {
    console.error(
      '매매사업자 결산참고 메모 조회 실패 (v23 마이그레이션 필요):',
      notesError.message,
    )
  } else if (notesData) {
    notes = notesData as NoteRow[]
  }

  const noteMap = new Map(notes.map((n) => [n.client_id, n]))
  const propsByClient = new Map<string, PropertyRow[]>()
  for (const row of (properties ?? []) as unknown as PropertyRow[]) {
    const list = propsByClient.get(row.client_id) ?? []
    list.push(row)
    propsByClient.set(row.client_id, list)
  }

  return (clients as ClientRow[]).map<TraderReviewRow>((client) => {
    const clientProps = propsByClient.get(client.id) ?? []
    const note = noteMap.get(client.id)

    let total_revenue = 0
    let total_cogs = 0
    let ending_inventory = 0
    let total_income_tax = 0
    let total_local_tax = 0

    const processed: TraderReviewProperty[] = clientProps.map((p) => {
      const acquisitionCost = (p.trader_property_expenses ?? [])
        .filter(
          (e) => e.category === '취득가액' && e.predeclaration_allowed === true,
        )
        .reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

      const transferDate = p.transfer_date
      const acquisitionDate = p.acquisition_date
      const transferAmount = Number(p.transfer_amount ?? 0)
      const prepaidIncomeTax = Number(p.prepaid_income_tax ?? 0)
      const prepaidLocalTax = Number(p.prepaid_local_tax ?? 0)

      const isTransferredInYear =
        transferDate !== null &&
        transferDate >= yearStart &&
        transferDate <= yearEnd

      const isInInventory =
        acquisitionDate !== null &&
        acquisitionDate <= yearEnd &&
        (transferDate === null || transferDate >= nextYearStart)

      if (isTransferredInYear) {
        total_revenue += transferAmount
        total_cogs += acquisitionCost
        total_income_tax += prepaidIncomeTax
        total_local_tax += prepaidLocalTax
      }
      if (isInInventory) {
        ending_inventory += acquisitionCost
      }

      return {
        id: p.id,
        property_name: p.property_name,
        acquisition_date: acquisitionDate,
        transfer_date: transferDate,
        transfer_amount: transferAmount,
        acquisition_cost: acquisitionCost,
        prepaid_income_tax: prepaidIncomeTax,
        prepaid_local_tax: prepaidLocalTax,
        is_transferred_in_year: isTransferredInYear,
        is_in_inventory: isInInventory,
      }
    })

    return {
      client_id: client.id,
      company_name: client.company_name,
      manager: client.manager ?? '',
      business_item: client.business_item ?? '',
      business_category_code: client.business_category_code ?? '',
      total_revenue,
      total_cogs,
      ending_inventory,
      total_income_tax,
      total_local_tax,
      properties: processed,
      memo: note?.memo ?? '',
      is_confirmed: note?.is_confirmed ?? false,
    }
  })
}

export async function getTraderManagers(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('manager')
    .in('business_category_code', TRADER_CATEGORY_CODES)
    .eq('is_terminated', false)
    .eq('is_temporary', false)
    .not('manager', 'is', null)

  if (error) throw new Error(`매매사업자 담당자 조회 실패: ${error.message}`)

  const set = new Set<string>()
  for (const row of data ?? []) {
    const m = ((row as { manager: string | null }).manager ?? '').trim()
    if (m) set.add(m)
  }
  return Array.from(set).sort()
}
