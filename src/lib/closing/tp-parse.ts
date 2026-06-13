/**
 * TP(홈택스) 부가세 합계표 엑셀 파싱 (Phase 7 재설계).
 *
 * 헤더: 귀속 | 사이트 | 상점ID | 구분 | 건수 | 공급가액 | 부가세 | 합계 | 조회일
 * 신고매출 = 같은 귀속기간 (매출)세금계산서 + (매출)계산서 + (매출)현금영수증
 *           + (매출)신용카드 + 수출실적명세서 + (매출)제로페이 의 공급가액 합.
 *
 * xlsx는 정적 import (동적 import는 빌드 실패 이력).
 */

import * as XLSX from 'xlsx'
import type { TpSalesAggregate } from './types'

// 헤더 후보 (공백 차이 흡수)
const COL_GUISOK = '귀속'
const COL_GUBUN = '구분'
const COL_SUPPLY = '공급가액'

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Math.round(value)
  if (typeof value === 'string') {
    const n = parseInt(value.replace(/[^0-9-]/g, ''), 10)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function toYearMonth(value: unknown): string | null {
  const d = String(value ?? '').replace(/\D/g, '')
  if (d.length < 6) return null
  return d.slice(0, 6)
}

/** 구분 문자열 → 집계 버킷 키 (매출 6종 + 매입 세금계산서) */
function bucketFor(gubun: string): keyof TpSalesAggregate | null {
  const g = gubun.replace(/\s/g, '')
  const isSales = g.includes('매출')
  const isPurchase = g.includes('매입')

  if (g.includes('세금계산서')) {
    if (isSales) return 'sales_tax_invoice'
    if (isPurchase) return 'purchase_tax_invoice'
    return null
  }
  if (g.includes('계산서') && isSales) return 'sales_invoice' // 세금계산서는 위에서 처리됨
  if (g.includes('현금영수증') && isSales) return 'sales_cash_receipt'
  if (g.includes('신용카드') && isSales) return 'sales_card'
  if (g.includes('수출실적')) return 'sales_export'
  if (g.includes('제로페이') && isSales) return 'sales_zeropay'
  return null
}

const SALES_KEYS: Array<keyof TpSalesAggregate> = [
  'sales_tax_invoice',
  'sales_invoice',
  'sales_cash_receipt',
  'sales_card',
  'sales_export',
  'sales_zeropay',
]

export async function parseTpSalesExcel(buffer: ArrayBuffer): Promise<TpSalesAggregate> {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  if (!sheet) throw new Error('엑셀에서 시트를 찾을 수 없습니다.')

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  const agg: TpSalesAggregate = {
    period_from: null,
    period_to: null,
    sales_tax_invoice: 0,
    sales_invoice: 0,
    sales_cash_receipt: 0,
    sales_card: 0,
    sales_export: 0,
    sales_zeropay: 0,
    sales_total: 0,
    purchase_tax_invoice: 0,
    raw_rows: [],
  }

  for (const row of rows) {
    const gubun = String(row[COL_GUBUN] ?? '').trim()
    if (!gubun) continue
    agg.raw_rows.push(row)

    // 귀속 기간 범위
    const ym = toYearMonth(row[COL_GUISOK])
    if (ym) {
      if (!agg.period_from || ym < agg.period_from) agg.period_from = ym
      if (!agg.period_to || ym > agg.period_to) agg.period_to = ym
    }

    const bucket = bucketFor(gubun)
    if (!bucket) continue
    const supply = toNumber(row[COL_SUPPLY])
    ;(agg[bucket] as number) += supply
  }

  agg.sales_total = SALES_KEYS.reduce((sum, k) => sum + (agg[k] as number), 0)
  return agg
}
