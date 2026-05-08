import type { IncomeTaxReport } from '@/types/database'

export type ParsedIncomeTaxData = Partial<Pick<IncomeTaxReport,
  | 'income_total' | 'income_deduction' | 'income_tax_base'
  | 'income_calculated_tax' | 'income_tax_reduction' | 'income_tax_credit'
  | 'income_comprehensive_tax' | 'income_separate_tax' | 'income_determined_total'
  | 'income_penalty_tax' | 'income_additional_tax' | 'income_total_tax'
  | 'income_prepaid_tax' | 'income_payable'
  | 'income_stock_deduct' | 'income_stock_add' | 'income_installment'
  | 'income_within_deadline' | 'income_refund_offset' | 'income_final_payable'
  | 'rural_total' | 'rural_deduction' | 'rural_tax_base'
  | 'rural_calculated_tax' | 'rural_tax_reduction' | 'rural_tax_credit'
  | 'rural_comprehensive_tax' | 'rural_separate_tax' | 'rural_determined_total'
  | 'rural_penalty_tax' | 'rural_additional_tax' | 'rural_total_tax'
  | 'rural_prepaid_tax' | 'rural_payable'
  | 'rural_stock_deduct' | 'rural_stock_add' | 'rural_installment'
  | 'rural_within_deadline' | 'rural_final_payable'
>>

/**
 * 정규화된 라벨 → [income필드, rural필드] 매핑.
 * 라벨은 normalizeLabel()로 전처리된 문자열.
 */
const LABEL_MAP: Array<[string, keyof ParsedIncomeTaxData, keyof ParsedIncomeTaxData]> = [
  ['종합소득금액',         'income_total',            'rural_total'],
  ['소득공제계',           'income_deduction',        'rural_deduction'],
  ['과세표준',             'income_tax_base',         'rural_tax_base'],
  ['산출세액',             'income_calculated_tax',   'rural_calculated_tax'],
  ['세액감면',             'income_tax_reduction',    'rural_tax_reduction'],
  ['세액공제',             'income_tax_credit',       'rural_tax_credit'],
  ['종합과세',             'income_comprehensive_tax','rural_comprehensive_tax'],
  ['분리과세',             'income_separate_tax',     'rural_separate_tax'],
  ['가산세',               'income_penalty_tax',      'rural_penalty_tax'],
  ['추가납부세액',         'income_additional_tax',   'rural_additional_tax'],
  ['기납부세액계',         'income_prepaid_tax',      'rural_prepaid_tax'],
  ['납부환급할총세액',     'income_payable',          'rural_payable'],
  ['신고기한내납부할세액', 'income_within_deadline',  'rural_within_deadline'],
  ['국세환급금충당',       'income_refund_offset',    'income_refund_offset'],
  ['충당후납부환급할세액', 'income_final_payable',    'rural_final_payable'],
]

export class IncomeTaxParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IncomeTaxParseError'
  }
}

/**
 * 홈택스에서 복사한 "세액의 계산" 표 텍스트를 파싱.
 * 패턴: 라벨(들) → 종합소득세 값 → 농어촌특별세 값 (반복)
 */
export function parseIncomeTaxTable(text: string): ParsedIncomeTaxData {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  if (lines.length < 5) {
    throw new IncomeTaxParseError('데이터가 너무 짧습니다. 표 전체를 복사해주세요.')
  }

  const result: ParsedIncomeTaxData = {}
  let foundCount = 0

  let i = 0
  while (i < lines.length) {
    const normalized = normalizeLabel(lines[i])

    // 세율 행은 % 값이라 숫자 파싱 대상 아님 — 건너뜀
    if (normalized.includes('세율')) {
      i++
      continue
    }

    const mapped = findMapping(normalized)

    if (mapped && i + 1 < lines.length) {
      const [incomeKey, ruralKey] = mapped

      const incomeVal = parseValue(lines[i + 1])
      if (incomeVal !== null) {
        result[incomeKey] = incomeVal
        foundCount++

        // 농특세 값 (다음 줄이 숫자면)
        if (i + 2 < lines.length && incomeKey !== ruralKey) {
          const ruralVal = parseValue(lines[i + 2])
          if (ruralVal !== null) {
            result[ruralKey] = ruralVal
            i += 3
            continue
          }
        }
        i += 2
        continue
      }
    }

    i++
  }

  if (foundCount === 0) {
    throw new IncomeTaxParseError(
      '인식 가능한 항목이 없습니다. 홈택스 "세액의 계산" 표를 정확히 복사해주세요.'
    )
  }

  return result
}

function findMapping(
  normalized: string
): [keyof ParsedIncomeTaxData, keyof ParsedIncomeTaxData] | null {
  for (const [pattern, incomeKey, ruralKey] of LABEL_MAP) {
    if (normalized === pattern || normalized.includes(pattern)) {
      return [incomeKey, ruralKey]
    }
  }
  return null
}

/** 라벨 정규화: 공백·괄호·숫자·특수문자 제거 */
function normalizeLabel(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/[()（）\[\]]/g, '')
    .replace(/[0-9+\-,.]+/g, '')
    .replace(/[※◯○▶]/g, '')
}

/** 숫자 파싱: "28,813,761" → 28813761, "-9,601,579" → -9601579 */
function parseValue(s: string | undefined): number | null {
  if (!s) return null
  const cleaned = s.replace(/,/g, '').replace(/원/g, '').trim()

  if (!cleaned || cleaned === '-') return null
  if (/^[가-힣A-Za-z]+$/.test(cleaned)) return null
  if (cleaned.endsWith('%')) return null

  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}
