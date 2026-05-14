import type {
  IncomeStatementSummary,
  IncomeTaxReport,
  TaxCredit,
  TaxReduction,
} from '@/types/database'

export function generateIncomeTaxConclusion(
  data: IncomeTaxReport,
  summary: IncomeStatementSummary | null,
): string {
  const sections: string[] = []

  sections.push(buildSummarySection(data, summary))

  const expenseSection = buildExpenseSection(summary)
  if (expenseSection) sections.push(expenseSection)

  const reviewSection = buildReviewSection(data)
  if (reviewSection) sections.push(reviewSection)

  const detailSection = buildDetailSection(data)
  if (detailSection) sections.push(detailSection)

  const prepaidSection = buildPrepaidSection(data)
  if (prepaidSection) sections.push(prepaidSection)

  sections.push(buildFinalTaxSection(data))
  sections.push(buildClosingSection(data))

  return sections.join('\n\n')
}

function buildSummarySection(
  data: IncomeTaxReport,
  summary: IncomeStatementSummary | null,
): string {
  const revenue = summary?.revenue ?? 0
  const netIncome = summary?.net_income ?? 0
  return `## 결산 요약
${data.report_year}년도 결산 결과 매출액은 ${formatBillionOrZero(revenue)}, 당기순이익은 ${formatBillionOrZero(netIncome)}입니다.`
}

/**
 * 주요 경비 항목 (조건부).
 * 손익계산서 요약에서 0보다 큰 항목 중 상위 4개를 만원 단위로 표시.
 * (현재 데이터 모델은 판매비와관리비를 단일 합계로 저장 — 세부 항목 표시 불가)
 */
function buildExpenseSection(summary: IncomeStatementSummary | null): string {
  if (!summary) return ''
  const candidates = [
    { name: '매출원가', amount: Number(summary.cogs) || 0 },
    { name: '판매비와 관리비', amount: Number(summary.sga) || 0 },
    { name: '영업외비용', amount: Number(summary.non_operating_expense) || 0 },
  ]
  const top = candidates
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)

  if (top.length === 0) return ''

  const lines = top.map((e) => `- ${e.name} ${formatAsManwon(e.amount)}`)
  return `## 주요 경비 항목
주요 경비 항목은 다음과 같습니다
${lines.join('\n')}`
}

/**
 * 세액공제·감면 검토 — 단일 합계 기준 (조건부).
 * income_deduction (소득공제계) / income_tax_reduction / income_tax_credit
 */
function buildReviewSection(data: IncomeTaxReport): string {
  const incomeDeduction = Number(data.income_deduction) || 0
  const taxReduction = Number(data.income_tax_reduction) || 0
  const taxCredit = Number(data.income_tax_credit) || 0

  if (incomeDeduction === 0 && taxReduction === 0 && taxCredit === 0) return ''

  const parts: string[] = []
  if (incomeDeduction > 0)
    parts.push(`소득공제 ${incomeDeduction.toLocaleString('ko-KR')}원`)
  if (taxReduction > 0)
    parts.push(`세액감면 ${taxReduction.toLocaleString('ko-KR')}원`)
  if (taxCredit > 0)
    parts.push(`세액공제 ${taxCredit.toLocaleString('ko-KR')}원`)

  return `## 세액공제·감면 검토
대표님께 적용 가능한 모든 세액공제·감면을 검토한 결과 ${parts.join(', ')} 적용되었습니다.`
}

/**
 * 주요 세액공제/세액감면 적용내역 (조건부).
 * tax_credits / tax_reductions 배열의 각 항목 표시.
 */
function buildDetailSection(data: IncomeTaxReport): string {
  const credits = (data.tax_credits ?? []) as TaxCredit[]
  const reductions = (data.tax_reductions ?? []) as TaxReduction[]

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
  if (creditLines.length > 0) {
    blocks.push(['[세액공제]', ...creditLines].join('\n'))
  }
  if (reductionLines.length > 0) {
    blocks.push(['[세액감면]', ...reductionLines].join('\n'))
  }

  return `## 주요 세액공제/세액감면 적용내역
${blocks.join('\n\n')}`
}

function buildPrepaidSection(data: IncomeTaxReport): string {
  const prepaid = Number(data.income_prepaid_tax) || 0
  if (prepaid === 0) return ''
  return `## 기납부세액
기납부하신 세액 ${prepaid.toLocaleString('ko-KR')}원 반영하였습니다.`
}

function buildFinalTaxSection(data: IncomeTaxReport): string {
  const finalAmount = Number(data.income_final_with_local) || 0
  const isRefund = finalAmount < 0
  const absAmount = Math.abs(finalAmount).toLocaleString('ko-KR')
  if (isRefund) {
    return `## 최종 환급세액
최종 환급받으실 세액은 지방소득세 포함 ${absAmount}원입니다.`
  }
  return `## 최종 납부세액
최종 납부하실 세액은 지방소득세 포함 ${absAmount}원입니다.`
}

function buildClosingSection(data: IncomeTaxReport): string {
  const nextYear = data.report_year + 1
  return `## 마무리 인사
올 한 해 고생 많으셨습니다. ${nextYear}년에는 더욱 번창하시길 기원합니다.`
}

function formatBillionOrZero(amount: number): string {
  if (amount === 0) return '0원'
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '△' : ''
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(1)}억원`
  }
  if (abs >= 1_000_000) {
    return `${sign}${Math.floor(abs / 1_000_000).toLocaleString('ko-KR')}백만원`
  }
  return `${sign}${abs.toLocaleString('ko-KR')}원`
}

function formatAsManwon(amount: number): string {
  const manwon = Math.round(amount / 10_000)
  return `${manwon.toLocaleString('ko-KR')}만원`
}
