import type {
  ConclusionSection,
  ConclusionSectionKey,
  IncomeStatementSummary,
  IncomeTaxReport,
  TaxCredit,
  TaxReduction,
} from '@/types/database'

const FIXED_SECTIONS: ReadonlyArray<{
  key: ConclusionSectionKey
  header: string
}> = [
  { key: 'business_summary', header: '결산 요약' },
  { key: 'expense_summary', header: '주요 경비 항목' },
  { key: 'tax_review', header: '세액공제·감면 검토' },
  { key: 'tax_detail', header: '주요 세액공제/세액감면 적용내역' },
  { key: 'prepaid_tax', header: '기납부세액' },
  { key: 'final_tax', header: '최종 납부세액' },
  { key: 'closing', header: '마무리 인사' },
]

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getDefaultConclusionSections(): ConclusionSection[] {
  return FIXED_SECTIONS.map((s, idx) => ({
    id: uid(),
    header: s.header,
    body: '',
    order: idx,
    is_visible: true,
    is_user_defined: false,
    section_key: s.key,
  }))
}

/** legacy conclusion_notes (마크다운 ## 헤더 텍스트) → 섹션 배열 변환 */
export function migrateConclusionToSections(
  notes: string | null,
): ConclusionSection[] {
  if (!notes || !notes.trim()) return getDefaultConclusionSections()

  const blocks = notes.split(/(?=^## )/m).filter((b) => b.trim())
  if (blocks.length === 0) return getDefaultConclusionSections()

  return blocks.map((block, idx) => {
    const lines = block.split('\n')
    const header = lines[0].replace(/^##\s*/, '').trim()
    const body = lines.slice(1).join('\n').trim()
    const known = FIXED_SECTIONS.find((s) =>
      header.includes(s.header) || s.header.includes(header),
    )
    return {
      id: uid(),
      header: header || '제목 없음',
      body,
      order: idx,
      is_visible: true,
      is_user_defined: !known,
      section_key: known?.key,
    }
  })
}

/** 자동 생성: 보고서 데이터로부터 섹션 본문 생성 */
export function generateConclusionSections(
  report: IncomeTaxReport,
  summary: IncomeStatementSummary | null,
  existing: ConclusionSection[] = [],
): ConclusionSection[] {
  const userDefined = existing.filter((s) => s.is_user_defined)
  const result: ConclusionSection[] = []

  result.push(buildSection('business_summary', '결산 요약', buildBusinessSummaryBody(report, summary)))

  const expenseBody = buildExpenseSummaryBody(summary)
  if (expenseBody) {
    result.push(buildSection('expense_summary', '주요 경비 항목', expenseBody))
  }

  const reviewBody = buildReviewBody(report)
  if (reviewBody) {
    result.push(buildSection('tax_review', '세액공제·감면 검토', reviewBody))
  }

  const detailBody = buildDetailBody(report)
  if (detailBody) {
    result.push(buildSection('tax_detail', '주요 세액공제/세액감면 적용내역', detailBody))
  }

  const prepaidBody = buildPrepaidBody(report)
  if (prepaidBody) {
    result.push(buildSection('prepaid_tax', '기납부세액', prepaidBody))
  }

  result.push(buildSection('final_tax', '최종 납부세액', buildFinalTaxBody(report)))
  result.push(buildSection('closing', '마무리 인사', buildClosingBody(report)))

  // 사용자 정의 섹션은 뒤에 유지
  const merged = [...result, ...userDefined]
  merged.forEach((s, idx) => {
    s.order = idx
  })
  return merged
}

function buildSection(
  key: ConclusionSectionKey,
  header: string,
  body: string,
): ConclusionSection {
  return {
    id: uid(),
    header,
    body,
    order: 0,
    is_visible: true,
    is_user_defined: false,
    section_key: key,
  }
}

function buildBusinessSummaryBody(
  report: IncomeTaxReport,
  summary: IncomeStatementSummary | null,
): string {
  const revenue = summary?.revenue ?? 0
  const netIncome = summary?.net_income ?? 0
  return `${report.report_year}년도 결산 결과 매출액은 ${formatBillionOrZero(revenue)}, 당기순이익은 ${formatBillionOrZero(netIncome)}입니다.`
}

function buildExpenseSummaryBody(
  summary: IncomeStatementSummary | null,
): string {
  if (!summary) return ''
  const candidates: Array<{ name: string; amount: number }> = []
  const details = summary.details

  if (details?.cogs && details.cogs.length > 0) candidates.push(...details.cogs)
  else if (Number(summary.cogs) > 0)
    candidates.push({ name: '매출원가', amount: Number(summary.cogs) })

  if (details?.sga && details.sga.length > 0) candidates.push(...details.sga)
  else if (Number(summary.sga) > 0)
    candidates.push({ name: '판매비와 관리비', amount: Number(summary.sga) })

  if (details?.non_operating_expense && details.non_operating_expense.length > 0) {
    candidates.push(...details.non_operating_expense)
  } else if (Number(summary.non_operating_expense) > 0) {
    candidates.push({
      name: '영업외비용',
      amount: Number(summary.non_operating_expense),
    })
  }

  const top = candidates
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)

  if (top.length === 0) return ''
  const lines = top.map((e) => `- ${e.name} ${formatAsManwon(e.amount)}`)
  return `주요 경비 항목은 다음과 같습니다\n${lines.join('\n')}`
}

function buildReviewBody(report: IncomeTaxReport): string {
  const incomeDeduction = Number(report.income_deduction) || 0
  const taxReduction = Number(report.income_tax_reduction) || 0
  const taxCredit = Number(report.income_tax_credit) || 0
  if (incomeDeduction === 0 && taxReduction === 0 && taxCredit === 0) return ''

  const items: string[] = []
  if (incomeDeduction > 0)
    items.push(`- 소득공제 ${incomeDeduction.toLocaleString('ko-KR')}원`)
  if (taxReduction > 0)
    items.push(`- 세액감면 ${taxReduction.toLocaleString('ko-KR')}원`)
  if (taxCredit > 0)
    items.push(`- 세액공제 ${taxCredit.toLocaleString('ko-KR')}원`)

  // 마지막 줄에 "이 적용되었습니다." 자연스럽게 붙임 ('원'은 받침 → '이')
  const lastIdx = items.length - 1
  items[lastIdx] = `${items[lastIdx]}이 적용되었습니다.`

  return ['대표님께 적용 가능한 모든 세액공제·감면을 검토한 결과', ...items].join('\n')
}

function buildDetailBody(report: IncomeTaxReport): string {
  const credits = (report.tax_credits ?? []) as TaxCredit[]
  const reductions = (report.tax_reductions ?? []) as TaxReduction[]

  const creditLines = credits
    .map((c) => {
      const total = (Number(c.current_amount) || 0) + (Number(c.carryover_amount) || 0)
      if (total <= 0) return ''
      const name = c.type === '직접 입력' ? c.custom_name?.trim() || c.type : c.type
      return `* ${name} ${total.toLocaleString('ko-KR')}원`
    })
    .filter(Boolean)

  const reductionLines = reductions
    .map((r) => {
      const amount = Number(r.current_amount) || 0
      if (amount <= 0) return ''
      const name = r.type === '직접 입력' ? r.custom_name?.trim() || r.type : r.type
      return `* ${name} ${amount.toLocaleString('ko-KR')}원`
    })
    .filter(Boolean)

  if (creditLines.length === 0 && reductionLines.length === 0) return ''

  const blocks: string[] = []
  if (creditLines.length > 0)
    blocks.push(['[세액공제]', ...creditLines].join('\n'))
  if (reductionLines.length > 0)
    blocks.push(['[세액감면]', ...reductionLines].join('\n'))
  return blocks.join('\n\n')
}

function buildPrepaidBody(report: IncomeTaxReport): string {
  const prepaid = Number(report.income_prepaid_tax) || 0
  if (prepaid === 0) return ''
  return `기납부하신 세액 ${prepaid.toLocaleString('ko-KR')}원 반영하였습니다.`
}

function buildFinalTaxBody(report: IncomeTaxReport): string {
  const finalAmount = Number(report.income_final_with_local) || 0
  const farmSpecial = Number(report.farm_special_tax) || 0
  const isRefund = finalAmount < 0
  const absAmount = Math.abs(finalAmount).toLocaleString('ko-KR')
  const inclusionLabel = farmSpecial > 0 ? '지방소득세 및 농어촌특별세 포함' : '지방소득세 포함'
  return isRefund
    ? `최종 환급받으실 세액은 ${inclusionLabel} ${absAmount}원입니다.`
    : `최종 납부하실 세액은 ${inclusionLabel} ${absAmount}원입니다.`
}

function buildClosingBody(report: IncomeTaxReport): string {
  const nextYear = report.report_year + 1
  return `올 한 해 고생 많으셨습니다. ${nextYear}년에는 더욱 번창하시길 기원합니다.`
}

function formatBillionOrZero(amount: number): string {
  if (amount === 0) return '0원'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '△' : ''
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억원`
  if (abs >= 1_000_000)
    return `${sign}${Math.floor(abs / 1_000_000).toLocaleString('ko-KR')}백만원`
  return `${sign}${abs.toLocaleString('ko-KR')}원`
}

function formatAsManwon(amount: number): string {
  const manwon = Math.round(amount / 10_000)
  return `${manwon.toLocaleString('ko-KR')}만원`
}
