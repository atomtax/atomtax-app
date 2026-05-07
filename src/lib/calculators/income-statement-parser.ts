import * as XLSX from 'xlsx'
import type { IncomeStatementSummary } from '@/types/database'

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
 * @param buffer - 엑셀 파일의 ArrayBuffer
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
      '엑셀 헤더에서 "(당)기" 컬럼을 찾을 수 없습니다. 위하고에서 다운받은 손익계산서 양식이 맞는지 확인해주세요.'
    )
  }

  // 위하고 양식: 헤더가 병합된 첫 컬럼은 세부 금액, 두 번째 컬럼이 합계
  const summaryCol = currentPeriodCol + 1

  // Roman numeral 행 찾아서 합계 추출
  const summary: Partial<IncomeStatementSummary> = {}
  const foundRomans = new Set<string>()

  for (let i = 2; i < rows.length; i++) {
    const subjectCell = String(rows[i][0] ?? '').trim()
    if (!subjectCell) continue

    const firstChar = subjectCell.charAt(0)
    const key = ROMAN_TO_KEY[firstChar]
    if (!key) continue

    foundRomans.add(firstChar)
    summary[key] = toNumber(rows[i][summaryCol])
  }

  if (!foundRomans.has('Ⅰ') || !foundRomans.has('Ⅹ')) {
    throw new IncomeStatementParseError(
      '매출액(Ⅰ) 또는 당기순이익(Ⅹ) 항목을 찾을 수 없습니다. 엑셀 형식을 확인해주세요.'
    )
  }

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
