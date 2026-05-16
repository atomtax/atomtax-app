import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getIndustryCodes, type IndustryCodeRow } from '@/lib/db/industry-codes'
import { getRegionZone, type RegionZone } from '@/lib/data/regional-zones'
import { isYoungAtOpening } from '@/lib/utils/startup-tax-reduction'
import type {
  IncomeStatementSummary,
  IncomeTaxReport,
  TaxCredit,
  TaxReduction,
} from '@/types/database'

/**
 * 일반사업자 결산참고 행.
 *
 * 보안: 주민번호 자체는 ReviewRow에 포함하지 않는다.
 *   - 서버에서 isYoungAtOpening()으로 boolean만 추출
 *   - 클라이언트에는 is_young만 전달
 */
export interface ReviewRow {
  client_id: string
  company_name: string
  manager: string
  business_item: string
  business_category_code: string | null
  address: string | null

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

  // 창감/중특 판단용 (PR #87)
  industry_info: ReviewIndustryInfo | null
  region_zone: RegionZone
  is_young: boolean
  opening_year: number | null

  memo: string
  is_confirmed: boolean
}

/** 결산참고 페이지에서 필요한 업종코드 마스터 필드만 추림 (페이로드 최소화). */
export interface ReviewIndustryInfo {
  industry_code: string
  startup_eligible: 'O' | 'X' | null
  startup_note: string | null
  mid_special_eligible: 'O' | 'X' | null
  small_biz_reduction_rate: number | null
  business_description: string | null
}

interface ClientRow {
  id: string
  company_name: string
  manager: string | null
  business_item: string | null
  business_category_code: string | null
  address: string | null
  resident_number: string | null
  opening_date: string | null
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
    .select(
      'id, company_name, manager, business_item, business_category_code, address, resident_number, opening_date',
    )
    .eq('business_type_category', '개인')
    .eq('is_terminated', false)
    .eq('is_temporary', false)
    .order('manager', { ascending: true, nullsFirst: false })
    .order('company_name', { ascending: true })

  if (params.manager) {
    clientQuery = clientQuery.eq('manager', params.manager)
  }

  const { data: clientsRaw, error: clientsError } = await clientQuery
  if (clientsError) {
    throw new Error(`개인 고객 조회 실패: ${clientsError.message}`)
  }
  if (!clientsRaw || clientsRaw.length === 0) return []

  // 매매사업자(703011, 703012) 제외 — NULL 안전을 위해 JS 후처리
  const TRADER_CODES = new Set(['703011', '703012'])
  const clients = (clientsRaw as ClientRow[]).filter(
    (c) => !c.business_category_code || !TRADER_CODES.has(c.business_category_code),
  )
  if (clients.length === 0) return []

  const clientIds = clients.map((c) => c.id)

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

  // 업종코드 마스터 batch lookup — N+1 방지 (PR #85)
  const industryCodes = Array.from(
    new Set(
      clients
        .map((c) => c.business_category_code)
        .filter((code): code is string => !!code),
    ),
  )
  const industryMap = await getIndustryCodes(industryCodes)

  return clients.map<ReviewRow>((client) => {
    const report = reportMap.get(client.id)
    const note = noteMap.get(client.id)
    const summary = report?.income_statement_summary as
      | IncomeStatementSummary
      | null
      | undefined

    // 창감/중특 판단용 메타 — 서버에서 계산해서 boolean만 전달 (주민번호 노출 X)
    const industryInfo = client.business_category_code
      ? pickIndustryInfo(industryMap[client.business_category_code])
      : null
    const regionZone = getRegionZone(client.address)
    const isYoung = isYoungAtOpening(client.resident_number, client.opening_date)
    const openingYear = client.opening_date
      ? new Date(client.opening_date).getFullYear()
      : null

    return {
      client_id: client.id,
      company_name: client.company_name,
      manager: client.manager ?? '',
      business_item: client.business_item ?? '',
      business_category_code: client.business_category_code,
      address: client.address,
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
      industry_info: industryInfo,
      region_zone: regionZone,
      is_young: isYoung,
      opening_year: openingYear,
      memo: note?.memo ?? '',
      is_confirmed: note?.is_confirmed ?? false,
    }
  })
}

function pickIndustryInfo(
  row: IndustryCodeRow | undefined,
): ReviewIndustryInfo | null {
  if (!row) return null
  return {
    industry_code: row.industry_code,
    startup_eligible: row.startup_eligible ?? null,
    startup_note: row.startup_note ?? null,
    mid_special_eligible: row.mid_special_eligible ?? null,
    small_biz_reduction_rate: row.small_biz_reduction_rate ?? null,
    business_description: row.business_description ?? null,
  }
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
