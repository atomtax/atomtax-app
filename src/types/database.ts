export type BusinessTypeCategory = '법인' | '개인'
export type AdjustmentBusinessType = 'corporate' | 'individual'

// ============================================================
// 매매사업자 (v20a)
// ============================================================
export const TRADER_BUSINESS_CODES = ['703011', '703012'] as const

export type TraderProgressStatus =
  | '미확인'
  | '확인'
  | '위하고입력'
  | '고객안내'
  | '신고완료'

export const TRADER_PROGRESS_STATUS_OPTIONS: TraderProgressStatus[] = [
  '미확인',
  '확인',
  '위하고입력',
  '고객안내',
  '신고완료',
]

export type TraderExpenseCategory = '취득가액' | '기타필요경비'
export const TRADER_EXPENSE_CATEGORY_OPTIONS: TraderExpenseCategory[] = [
  '취득가액',
  '기타필요경비',
]

export interface Client {
  id: string
  number: string | null
  company_name: string
  business_number: string | null
  corporate_number: string | null
  representative: string | null
  manager: string | null
  phone: string | null
  address: string | null
  business_type: string | null
  business_item: string | null
  business_type_category: BusinessTypeCategory
  start_date: string | null
  end_date: string | null
  contract_amount: number | null
  supply_amount: number | null
  tax_amount: number | null
  is_terminated: boolean
  termination_date: string | null
  notes: string | null
  email: string | null
  google_drive_folder_url: string | null
  trader_drive_folder_url: string | null
  resident_number: string | null
  business_category_code: string | null
  postal_code: string | null
  supply_value: number
  tax_value: number
  initial_billing_month: string | null
  hometax_id: string | null
  hometax_password: string | null
  created_at: string
  updated_at: string
}

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'>
export type ClientUpdate = Partial<ClientInsert>

// ============================================================
// 법인세 보고서 (v17)
// ============================================================
export type CorporateTaxReportStatus = 'draft' | 'completed'

export interface IncomeStatementDetailItem {
  name: string
  amount: number
}

export interface IncomeStatementDetails {
  revenue?: IncomeStatementDetailItem[]
  cogs?: IncomeStatementDetailItem[]
  sga?: IncomeStatementDetailItem[]
  non_operating_revenue?: IncomeStatementDetailItem[]
  non_operating_expense?: IncomeStatementDetailItem[]
}

export interface IncomeStatementSummary {
  revenue: number
  cogs: number
  gross_profit: number
  sga: number
  operating_income: number
  non_operating_revenue: number
  non_operating_expense: number
  pretax_income: number
  corporate_tax: number
  net_income: number
  /** 위하고 손익계산서 세부 항목 (선택, v22 파서 이후 업로드 분만 채워짐) */
  details?: IncomeStatementDetails
}

export interface TaxCredit {
  type: string
  custom_name?: string
  current_amount: number
  carryover_amount: number
}

export interface TaxReduction {
  type: string
  custom_name?: string
  current_amount: number
}

export interface CorporateTaxReport {
  id: string
  client_id: string | null

  report_year: number
  status: CorporateTaxReportStatus

  income_statement_filename: string | null
  income_statement_period_label: string | null
  income_statement_summary: IncomeStatementSummary | null

  revenue: number | null
  net_income: number | null

  calculated_tax: number
  determined_tax: number
  local_tax: number
  rural_special_tax: number
  prepaid_tax: number
  final_tax: number

  current_loss: number
  carryover_loss: number

  tax_credits: TaxCredit[]
  tax_reductions: TaxReduction[]

  is_sincere_filing: boolean
  additional_notes: string | null
  conclusion_notes: string | null

  completed_at: string | null
  created_at: string
  updated_at: string
}

export type CorporateTaxReportInsert = Omit<CorporateTaxReport, 'id' | 'created_at' | 'updated_at'>
export type CorporateTaxReportUpdate = Partial<CorporateTaxReportInsert>

/** 목록 페이지에서 사용 — 고객 + 보고서 조인 결과 */
export interface CorporateClientWithReport {
  client: {
    id: string
    company_name: string
    representative: string | null
    business_number: string | null
    manager: string | null
  }
  report: Pick<CorporateTaxReport, 'id' | 'status' | 'completed_at' | 'updated_at'> | null
}

export interface AdjustmentInvoice {
  id: string
  client_id: string | null
  business_type: AdjustmentBusinessType
  client_name: string
  business_number: string | null
  revenue: number
  settlement_fee: number
  adjustment_fee: number
  tax_credit_additional: number
  faithful_report_fee: number
  discount: number
  final_fee: number
  year: number | null
  payment_method: '자동이체' | '직접입금' | '미확인'
  is_paid: boolean
  paid_at: string | null
  supply_amount: number
  vat_amount: number
  total_amount: number
  created_at: string
  updated_at: string
}

export type AdjustmentInvoiceInsert = Omit<AdjustmentInvoice, 'id' | 'created_at' | 'updated_at'>
export type AdjustmentInvoiceUpdate = Partial<AdjustmentInvoiceInsert>

export interface TraderProperty {
  id: string
  client_id: string
  property_name: string
  display_order: number
  acquisition_amount: number
  other_expenses: number
  transfer_amount: number
  acquisition_date: string | null
  transfer_date: string | null
  transfer_income: number
  filing_deadline: string | null
  prepaid_income_tax: number
  prepaid_local_tax: number
  location: string | null
  is_85_over: boolean
  comparison_taxation: boolean
  progress_status: TraderProgressStatus
  land_area: number
  building_area: number
  created_at: string
  updated_at: string
}

export type TraderPropertyInput = Omit<TraderProperty, 'id' | 'created_at' | 'updated_at'>
export type TraderPropertyInsert = TraderPropertyInput
export type TraderPropertyUpdate = Partial<TraderPropertyInput>

export interface TraderPropertyExpense {
  id: string
  property_id: string
  row_no: number
  expense_name: string | null
  category: TraderExpenseCategory
  amount: number
  predeclaration_allowed: boolean
  income_tax_allowed: boolean
  memo: string | null
  created_at: string
  updated_at: string
}

export type TraderPropertyExpenseInput = Omit<TraderPropertyExpense, 'id' | 'created_at' | 'updated_at'>
export type TraderPropertyExpenseInsert = TraderPropertyExpenseInput
export type TraderPropertyExpenseUpdate = Partial<TraderPropertyExpenseInput>

// ============================================================
// 종합소득세 보고서 (v19)
// ============================================================
export type IncomeTaxReportStatus = 'draft' | 'completed'

export interface IncomeTaxReport {
  id: string
  client_id: string | null
  report_year: number
  status: IncomeTaxReportStatus

  // 종합소득세
  income_total: number
  income_deduction: number
  income_tax_base: number
  income_applied_rate: number
  income_calculated_tax: number
  income_tax_reduction: number
  income_tax_credit: number
  income_comprehensive_tax: number
  income_separate_tax: number
  income_determined_total: number
  income_penalty_tax: number
  income_additional_tax: number
  income_total_tax: number
  income_prepaid_tax: number
  income_payable: number
  income_stock_deduct: number
  income_stock_add: number
  income_installment: number
  income_within_deadline: number
  income_refund_offset: number
  income_final_payable: number
  income_local_tax: number
  income_final_with_local: number

  // 농어촌특별세
  rural_total: number
  rural_deduction: number
  rural_tax_base: number
  rural_calculated_tax: number
  rural_tax_reduction: number
  rural_tax_credit: number
  rural_comprehensive_tax: number
  rural_separate_tax: number
  rural_determined_total: number
  rural_penalty_tax: number
  rural_additional_tax: number
  rural_total_tax: number
  rural_prepaid_tax: number
  rural_payable: number
  rural_stock_deduct: number
  rural_stock_add: number
  rural_installment: number
  rural_within_deadline: number
  rural_final_payable: number

  // 손익계산서
  income_statement_filename: string | null
  income_statement_period_label: string | null
  income_statement_summary: IncomeStatementSummary | null

  // 세액공제/감면 (v19c)
  tax_credits: TaxCredit[]
  tax_reductions: TaxReduction[]

  // 메모
  is_sincere_filing: boolean
  additional_notes: string | null
  conclusion_notes: string | null

  completed_at: string | null
  created_at: string
  updated_at: string
}

/** 목록 페이지에서 사용 — 고객 + 보고서 조인 결과 */
export interface IncomeClientWithReport {
  client: {
    id: string
    company_name: string
    representative: string | null
    business_number: string | null
    manager: string | null
  }
  report: Pick<IncomeTaxReport, 'id' | 'status' | 'completed_at' | 'updated_at'> | null
}

// ============================================================
// 결산참고 메모 (v22) — 종합소득세 일반사업자 참고용
// 매출액/세액 등은 income_tax_reports를 실시간 조회.
// 이 테이블은 사용자 메모 + 확인여부만 저장.
// ============================================================
export interface IncomeTaxReviewNote {
  id: string
  client_id: string
  report_year: number
  memo: string
  is_confirmed: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// 매매사업자 결산참고 메모 (v23)
// 매출액/매출원가/기말재고/세금은 trader_properties 실시간 집계.
// 이 테이블은 사용자 메모 + 확인여부만 저장.
// ============================================================
export interface TraderReviewNote {
  id: string
  client_id: string
  report_year: number
  memo: string
  is_confirmed: boolean
  created_at: string
  updated_at: string
}
