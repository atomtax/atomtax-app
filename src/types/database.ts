export type BusinessTypeCategory = '법인' | '개인'
export type AdjustmentBusinessType = 'corporate' | 'individual'

// ============================================================
// 매매사업자 (Phase 3)
// ============================================================
export const TRADER_BUSINESS_CODES = ['703011', '703012'] as const
export type ProgressStatus = '미확인' | '진행중' | '완료'
export const PROGRESS_STATUS_OPTIONS: ProgressStatus[] = ['미확인', '진행중', '완료']

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

export interface TraderInventory {
  id: string
  client_id: string | null
  property_address: string | null
  property_type: string | null
  acquisition_date: string | null
  acquisition_price: number | null
  transfer_date: string | null
  transfer_price: number | null
  filing_deadline: string | null
  progress_status: ProgressStatus
  is_taxable: boolean
  output_vat: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TraderInventoryWithClient extends TraderInventory {
  client: {
    id: string
    company_name: string
    representative: string | null
    business_number: string | null
    business_category_code: string | null
  } | null
}

export interface Expense {
  id: string
  trader_inventory_id: string | null
  client_id: string | null
  expense_date: string | null
  category: string | null
  amount: number
  description: string | null
  input_vat: number | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

export type TraderInventoryInput = Omit<TraderInventory, 'id' | 'created_at' | 'updated_at'>
export type TraderInventoryInsert = TraderInventoryInput
export type TraderInventoryUpdate = Partial<TraderInventoryInput>
export type ExpenseInput = Omit<Expense, 'id' | 'created_at' | 'updated_at'>
export type ExpenseInsert = ExpenseInput
export type ExpenseUpdate = Partial<ExpenseInput>

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
