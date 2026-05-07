export type BusinessTypeCategory = '법인' | '개인'
export type TraderStatus = '미확인' | '진행중' | '완료'
export type AdjustmentBusinessType = 'corporate' | 'individual'

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

export interface CorporateTaxReport {
  id: string
  client_id: string
  year: number
  revenue: number | null
  net_profit: number | null
  tax_payment: number | null
  tax_refund: number | null
  prepaid_tax: number | null
  current_loss: number | null
  carryforward_loss: number | null
  tax_credit_type: string | null
  tax_credit_increase: number | null
  tax_credit_carryforward: number | null
  tax_credit_note: string | null
  has_tax_credit: boolean
  requires_faithful_report: boolean
  faithful_report_note: string | null
  additional_notes: string | null
  income_statement: Record<string, unknown> | null
  financial_statements: Record<string, unknown> | null
  calculated_tax: number | null
  local_tax: number | null
  rural_tax: number | null
  determined_tax: number | null
  created_at: string
  updated_at: string
}

export type CorporateTaxReportInsert = Omit<CorporateTaxReport, 'id' | 'created_at' | 'updated_at'>
export type CorporateTaxReportUpdate = Partial<CorporateTaxReportInsert>

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
  client_id: string
  property_name: string | null
  acquisition_date: string | null
  disposal_date: string | null
  report_deadline: string | null
  status: TraderStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type TraderInventoryInsert = Omit<TraderInventory, 'id' | 'created_at' | 'updated_at'>
export type TraderInventoryUpdate = Partial<TraderInventoryInsert>

export interface Expense {
  id: string
  inventory_id: string
  category: string | null
  amount: number | null
  description: string | null
  created_at: string
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at'>
export type ExpenseUpdate = Partial<ExpenseInsert>
