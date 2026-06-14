/**
 * 위하고 마감감지 + TP 매출 (Phase 7 재설계) 공용 타입.
 */

export type ClosingTaxType = 'income' | 'vat'

export const CLOSING_TAX_TYPE_LABEL: Record<ClosingTaxType, string> = {
  income: '종소세/법인세',
  vat: '부가가치세',
}

/** 위하고 마감현황 응답(common/make/master) result_data[] 행 */
export interface ClosingResponseRow {
  no_biz?: string
  nm_krcom?: string
  cno?: string
  da_period?: string
  dm_fndbegin?: string
  dm_fndend?: string
  str_3?: string // 마감 플래그 '1'/'0'/''
  str_6?: string // 마감일시 YYYYMMDDHHMMSS (마감 시 값)
  str_7?: string // 담당자 id
}

export type ClosingChangeType = 'new_closed' | 're_closed'

export interface DetectSummary {
  newClosed: number
  reClosed: number
  unchanged: number
  excluded: number // 기장거래처 외 제외
  events: Array<{
    company_name: string
    change_type: ClosingChangeType
    period: string | null
  }>
}

/** TP 부가세 합계표 집계 결과 */
export interface TpSalesAggregate {
  period_from: string | null
  period_to: string | null
  sales_tax_invoice: number
  sales_invoice: number
  sales_cash_receipt: number
  sales_card: number
  sales_export: number
  sales_zeropay: number
  sales_total: number
  purchase_tax_invoice: number
  raw_rows: Array<Record<string, unknown>>
}
