import * as XLSX from 'xlsx'
import type {
  IncomeStatementDetails,
  IncomeStatementSummary,
} from '@/types/database'

const ROMAN_TO_KEY: Record<string, keyof IncomeStatementSummary> = {
  'Ⅰ': 'revenue',
  'Ⅱ': 'cogs',
  'Ⅲ': 'gross_profit',
  'Ⅳ': 'sga',
  'Ⅴ': 'operating_income',
  'Ⅵ': 'non_operating_revenue',
  'Ⅶ': 'non_operating_expense',
  'Ⅷ': 'pretax_income',
  'Ⅸ': 'corporate_tax',
  'Ⅹ': 'net_income',
}

// 세부 행이 의미 있는 카테고리만 details 에 수집
// (gross_profit / operating_income / pretax_income / corporate_tax / net_income 은 계산 합계 — 하위 행 없음)
const DETAIL_KEYS: ReadonlyArray<keyof IncomeStatementDetails> = [
  'revenue',
  'cogs',
  'sga',
  'non_operating_revenue',
  'non_operating_expense',
]

function isDetailKey(
  key: keyof IncomeStatementSummary,
): key is keyof IncomeStatementDetails {
  return (DETAIL_KEYS as readonly string[]).includes(key)
}

export interface ParsedIncomeStatement {
  period_label: string
  summary: IncomeStatementSummary
}

export class IncomeStatementParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IncomeStatementParseError'
  }
}

/**
 * 위하고 손익계산서 엑셀을 파싱해서 (당)기 데이터를 추출.
 * Roman numeral 행의 합계 + 그 아래 세부 항목까지 수집.
 */
export function parseIncomeStatement(buffer: ArrayBuffer): ParsedIncomeStatement {
  const wb = XLSX.read(buffer, { type: 'array' })
  if (!wb.SheetNames.length) {
    throw new IncomeStatementParseError('엑셀에 시트가 없습니다.')
  }

  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  })

  if (rows.length < 3) {
    throw new IncomeStatementParseError('데이터 행이 부족합니다.')
  }

  // 헤더 행에서 "(당)" 또는 "당기" 텍스트 위치 찾기
  const headerRow = rows[0]
  let currentPeriodCol = -1
  let periodLabel = ''

  for (let i = 0; i < headerRow.length; i++) {
    const cell = String(headerRow[i] ?? '')
    if (cell.includes('(당)') || cell.includes('당기')) {
      currentPeriodCol = i
      periodLabel = cell.trim()
      break
    }
  }

  if (currentPeriodCol === -1) {
    throw new IncomeStatementParseError(
      '엑셀 헤더에서 "(당)기" 컬럼을 찾을 수 없습니다. 위하고에서 다운받은 손익계산서 양식이 맞는지 확인해주세요.',
    )
  }

  // 위하고 양식: 헤더가 병합된 첫 컬럼은 세부 금액, 두 번째 컬럼이 합계
  const detailCol = currentPeriodCol
  const summaryCol = currentPeriodCol + 1

  const summary: Partial<IncomeStatementSummary> = {}
  const details: IncomeStatementDetails = {}
  const foundRomans = new Set<string>()
  let currentDetailKey: keyof IncomeStatementDetails | null = null

  for (let i = 2; i < rows.length; i++) {
    const rawSubject = String(rows[i][0] ?? '')
    if (!rawSubject.trim()) continue
    const subjectTrimmed = rawSubject.trim()

    const firstChar = subjectTrimmed.charAt(0)
    const key = ROMAN_TO_KEY[firstChar]

    if (key) {
      // Roman 합계 행
      foundRomans.add(firstChar)
      summary[key] = toNumber(rows[i][summaryCol])
      currentDetailKey = isDetailKey(key) ? key : null
      continue
    }

    // 들여쓰기된 세부 항목 (앞쪽에 공백 있음)
    const isIndented = /^\s/.test(rawSubject)
    if (!isIndented || !currentDetailKey) continue

    const amount = toNumber(rows[i][detailCol])
    if (amount === 0) continue

    const bucket = details[currentDetailKey] ?? []
    bucket.push({ name: subjectTrimmed, amount })
    details[currentDetailKey] = bucket
  }

  if (!foundRomans.has('Ⅰ') || !foundRomans.has('Ⅹ')) {
    throw new IncomeStatementParseError(
      '매출액(Ⅰ) 또는 당기순이익(Ⅹ) 항목을 찾을 수 없습니다. 엑셀 형식을 확인해주세요.',
    )
  }

  const hasAnyDetails = Object.values(details).some(
    (arr) => Array.isArray(arr) && arr.length > 0,
  )

  const fullSummary: IncomeStatementSummary = {
    revenue: summary.revenue ?? 0,
    cogs: summary.cogs ?? 0,
    gross_profit: summary.gross_profit ?? 0,
    sga: summary.sga ?? 0,
    operating_income: summary.operating_income ?? 0,
    non_operating_revenue: summary.non_operating_revenue ?? 0,
    non_operating_expense: summary.non_operating_expense ?? 0,
    pretax_income: summary.pretax_income ?? 0,
    corporate_tax: summary.corporate_tax ?? 0,
    net_income: summary.net_income ?? 0,
    ...(hasAnyDetails ? { details } : {}),
  }

  return { period_label: periodLabel, summary: fullSummary }
}

function toNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === 'number') return Math.round(value)
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s원]/g, '')
    const n = Number(cleaned)
    return Number.isFinite(n) ? Math.round(n) : 0
  }
  return 0
}
