import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type {
  IncomeStatementSummary,
  IncomeTaxReport,
  TaxCredit,
  TaxReduction,
} from '@/types/database'

export interface ReviewRow {
  client_id: string
  company_name: string
  manager: string
  business_item: string

  has_report: boolean
  // 손익계산서에서 추출
  revenue: number | null
  operating_income: number | null
  net_income: number | null
  // income_tax_reports 컬럼
  income_total: number | null
  income_calculated_tax: number | null
  income_tax_credit: number | null
  income_tax_reduction: number | null
  income_determined_total: number | null
  income_prepaid_tax: number | null
  income_final_payable: number | null

  tax_credits: TaxCredit[]
  tax_reductions: TaxReduction[]

  memo: string
  is_confirmed: boolean
}

interface ClientRow {
  id: string
  company_name: string
  manager: string | null
  business_item: string | null
}

type ReportRow = Pick<
  IncomeTaxReport,
  | 'client_id'
  | 'income_total'
  | 'income_calculated_tax'
  | 'income_tax_credit'
  | 'income_tax_reduction'
  | 'income_determined_total'
  | 'income_prepaid_tax'
  | 'income_final_payable'
  | 'income_statement_summary'
  | 'tax_credits'
  | 'tax_reductions'
>

interface NoteRow {
  client_id: string
  memo: string
  is_confirmed: boolean
}

/**
 * 결산참고 데이터 조회 — 일반사업자 (개인사업자).
 * 활성 개인사업자 + 해당 연도 종합소득세 보고서 + 결산참고 메모 LEFT JOIN.
 * 보고서 미작성 고객도 행은 표시 (값은 null).
 */
export async function getReviewData(params: {
  year: number
  manager?: string
}): Promise<ReviewRow[]> {
  const supabase = await createClient()

  let clientQuery = supabase
    .from('clients')
    .select('id, company_name, manager, business_item')
    .eq('business_type_category', '개인')
    .eq('is_terminated', false)
    .eq('is_temporary', false)
    .order('manager', { ascending: true, nullsFirst: false })
    .order('company_name', { ascending: true })

  if (params.manager) {
    clientQuery = clientQuery.eq('manager', params.manager)
  }

  const { data: clients, error: clientsError } = await clientQuery
  if (clientsError) {
    throw new Error(`개인 고객 조회 실패: ${clientsError.message}`)
  }
  if (!clients || clients.length === 0) return []

  const clientIds = (clients as ClientRow[]).map((c) => c.id)

  const reportColumns = [
    'client_id',
    'income_total',
    'income_calculated_tax',
    'income_tax_credit',
    'income_tax_reduction',
    'income_determined_total',
    'income_prepaid_tax',
    'income_final_payable',
    'income_statement_summary',
    'tax_credits',
    'tax_reductions',
  ].join(',')

  const { data: reports, error: reportsError } = await supabase
    .from('income_tax_reports')
    .select(reportColumns)
    .in('client_id', clientIds)
    .eq('report_year', params.year)

  if (reportsError) {
    console.error('종합소득세 보고서 조회 실패:', reportsError.message)
  }

  // 결산참고 메모 (테이블 없으면 빈 결과로 폴백)
  let notes: NoteRow[] = []
  const { data: notesData, error: notesError } = await supabase
    .from('income_tax_review_notes')
    .select('client_id, memo, is_confirmed')
    .in('client_id', clientIds)
    .eq('report_year', params.year)

  if (notesError) {
    console.error(
      '결산참고 메모 조회 실패 (v22 마이그레이션 필요):',
      notesError.message,
    )
  } else if (notesData) {
    notes = notesData as NoteRow[]
  }

  const reportMap = new Map(
    ((reports ?? []) as unknown as ReportRow[]).map((r) => [
      r.client_id as string,
      r,
    ]),
  )
  const noteMap = new Map(notes.map((n) => [n.client_id, n]))

  return (clients as ClientRow[]).map<ReviewRow>((client) => {
    const report = reportMap.get(client.id)
    const note = noteMap.get(client.id)
    const summary = report?.income_statement_summary as
      | IncomeStatementSummary
      | null
      | undefined

    return {
      client_id: client.id,
      company_name: client.company_name,
      manager: client.manager ?? '',
      business_item: client.business_item ?? '',
      has_report: !!report,
      revenue: summary?.revenue ?? null,
      operating_income: summary?.operating_income ?? null,
      net_income: summary?.net_income ?? null,
      income_total: report?.income_total ?? null,
      income_calculated_tax: report?.income_calculated_tax ?? null,
      income_tax_credit: report?.income_tax_credit ?? null,
      income_tax_reduction: report?.income_tax_reduction ?? null,
      income_determined_total: report?.income_determined_total ?? null,
      income_prepaid_tax: report?.income_prepaid_tax ?? null,
      income_final_payable: report?.income_final_payable ?? null,
      tax_credits: (report?.tax_credits as TaxCredit[] | null) ?? [],
      tax_reductions: (report?.tax_reductions as TaxReduction[] | null) ?? [],
      memo: note?.memo ?? '',
      is_confirmed: note?.is_confirmed ?? false,
    }
  })
}

export async function getActiveManagers(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('manager')
    .eq('business_type_category', '개인')
    .eq('is_terminated', false)
    .eq('is_temporary', false)
    .not('manager', 'is', null)

  if (error) throw new Error(`담당자 조회 실패: ${error.message}`)

  const set = new Set<string>()
  for (const row of data ?? []) {
    const m = ((row as { manager: string | null }).manager ?? '').trim()
    if (m) set.add(m)
  }
  return Array.from(set).sort()
}
