import * as XLSX from 'xlsx'
import {
  EXPENSE_NAMES,
  type ExpenseName,
} from '@/lib/constants/property-expense'
import type { TraderExpenseCategory } from '@/types/database'

export interface ParsedProperty {
  business_number: string
  property_name: string
  location: string
  property_type: string
  acquisition_date: string
  transfer_date: string | null
  transfer_amount: number
  prepaid_income_tax: number
  prepaid_local_tax: number
}

export interface ParsedExpense {
  business_number: string
  property_name: string
  row_no: number
  expense_name: ExpenseName
  amount: number
  predeclaration_allowed: boolean
  income_tax_allowed: boolean
  category: TraderExpenseCategory
}

export interface ParseResult {
  properties: ParsedProperty[]
  expenses: ParsedExpense[]
}

const PROPERTIES_SHEET = '재고자산정리'
const EXPENSES_SHEET = '필요경비상세'

export async function parseTraderUploadExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })

  const propertiesSheet = wb.Sheets[PROPERTIES_SHEET]
  const expensesSheet = wb.Sheets[EXPENSES_SHEET]

  if (!propertiesSheet) {
    throw new Error(`"${PROPERTIES_SHEET}" 시트가 없습니다.`)
  }
  if (!expensesSheet) {
    throw new Error(`"${EXPENSES_SHEET}" 시트가 없습니다.`)
  }

  const rawProperties = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    propertiesSheet,
    { defval: '' },
  )
  const rawExpenses = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    expensesSheet,
    { defval: '' },
  )

  const properties: ParsedProperty[] = []
  for (const row of rawProperties) {
    const biz = normalizeBusinessNumber(row['사업자등록번호'])
    const name = String(row['물건명'] ?? '').trim()
    if (!biz || !name) continue
    const acquisitionDate = parseDate(row['취득일'])
    if (!acquisitionDate) continue

    properties.push({
      business_number: biz,
      property_name: name,
      location: String(row['주소'] ?? '').trim(),
      property_type: String(row['물건종류'] ?? '').trim(),
      acquisition_date: acquisitionDate,
      transfer_date: parseDate(row['양도일']) || null,
      transfer_amount: parseNumber(row['양도가액']),
      prepaid_income_tax: parseNumber(row['기납부종소세']),
      prepaid_local_tax: parseNumber(row['기납부지방세']),
    })
  }

  const expenses: ParsedExpense[] = []
  for (const row of rawExpenses) {
    const biz = normalizeBusinessNumber(row['사업자등록번호'])
    const name = String(row['물건명'] ?? '').trim()
    const rawExpenseName = String(row['비용명'] ?? '').trim()
    if (!biz || !name || !rawExpenseName) continue

    const categoryRaw = String(row['카테고리'] ?? '').trim()
    const category: TraderExpenseCategory =
      categoryRaw === '취득가액' ? '취득가액' : '기타필요경비'

    expenses.push({
      business_number: biz,
      property_name: name,
      row_no: Number(row['순번']) || 0,
      expense_name: mapExpenseName(rawExpenseName),
      amount: parseNumber(row['금액']),
      predeclaration_allowed: parseOX(row['예정신고비용인정']),
      income_tax_allowed: parseOX(row['종합소득세비용인정']),
      category,
    })
  }

  return { properties, expenses }
}

/**
 * 엑셀의 비용명을 시스템 EXPENSE_NAMES 옵션 중 하나로 매핑.
 * 정확 일치는 그대로, 키워드 포함은 카테고리화, 미매치는 '기타비용'.
 */
export function mapExpenseName(raw: string): ExpenseName {
  const name = raw.trim()
  if (!name) return '기타비용'

  // 정확 일치
  for (const opt of EXPENSE_NAMES) {
    if (name === opt) return opt
  }

  // 키워드 매핑 (구체적인 케이스부터)
  if (name.includes('취득세') || name.includes('등기')) return '취득세 등'
  if (name.includes('신탁')) return '신탁말소비용'
  if (name.includes('중개')) return '중개수수료'
  if (name.includes('관리비')) return '관리비정산'
  if (name === '취득가액') return '취득가액'

  return '기타비용'
}

/**
 * "207-12-99830", "2071299830", 2071299830 등을 "207-12-99830" 형식으로 정규화.
 * 숫자 10자리가 아니면 빈 문자열 (매칭 실패 처리).
 */
export function normalizeBusinessNumber(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length !== 10) return ''
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

function parseDate(v: unknown): string {
  if (v == null || v === '') return ''
  if (v instanceof Date) {
    const yyyy = v.getFullYear()
    const mm = String(v.getMonth() + 1).padStart(2, '0')
    const dd = String(v.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  const s = String(v).trim()
  if (!s) return ''
  return s.split('T')[0]
}

function parseNumber(v: unknown): number {
  if (v == null || v === '') return 0
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function parseOX(v: unknown): boolean {
  return String(v ?? '').trim().toUpperCase() === 'O'
}
