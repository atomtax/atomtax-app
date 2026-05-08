import type { IncomeTaxReport, IncomeStatementSummary, TaxCredit, TaxReduction } from '@/types/database'

export function generateIncomeTaxConclusion(
  data: IncomeTaxReport,
  summary: IncomeStatementSummary | null
): string {
  const reportYear = data.report_year
  const nextYear = reportYear + 1

  // 1. 결산 요약
  const revenue = summary?.revenue ?? 0
  const netIncome = summary?.net_income ?? 0
  const section1 = `## 결산 요약
${reportYear}년도 결산 결과 매출액은 ${formatBillionOrZero(revenue)}, 당기순이익은 ${formatBillionOrZero(netIncome)}입니다.`

  // 2. 세액공제·감면 검토
  const section2 = `## 세액공제·감면 검토
대표님께 적용 가능한 모든 세액공제·감면을 검토하여 반영하였습니다.`

  // 3. 적용 내역
  const credits = data.tax_credits ?? []
  const reductions = data.tax_reductions ?? []
  const creditPart = formatCreditsText(credits)
  const reductionPart = formatReductionsText(reductions)
  const section3 = `## 적용 내역
${creditPart} ${reductionPart}`

  // 4. 최종 세액
  const finalAmount = data.income_final_with_local
  const isRefund = finalAmount < 0
  const absAmount = Math.abs(finalAmount)
  const formattedAmount = absAmount.toLocaleString('ko-KR')
  const section4Title = isRefund ? '최종 환급세액' : '최종 납부세액'
  const section4Body = isRefund
    ? `최종 환급받으실 세액은 지방소득세 포함 ${formattedAmount}원입니다.`
    : `최종 납부하실 세액은 지방소득세 포함 ${formattedAmount}원입니다.`
  const section4 = `## ${section4Title}
${section4Body}`

  // 5. 마무리 인사 (PDF 진파랑 박스에 자동 삽입)
  const section5 = `## 마무리 인사
올 한 해 고생 많으셨습니다. ${nextYear}년에는 더욱 번창하시길 기원합니다.`

  return [section1, section2, section3, section4, section5].join('\n\n')
}

function formatBillionOrZero(amount: number): string {
  if (amount === 0) return '0원'
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '△' : ''
  if (absAmount >= 100_000_000) {
    return `${sign}${(absAmount / 100_000_000).toFixed(1)}억원`
  }
  if (absAmount >= 1_000_000) {
    return `${sign}${Math.floor(absAmount / 1_000_000).toLocaleString('ko-KR')}백만원`
  }
  return `${sign}${absAmount.toLocaleString('ko-KR')}원`
}

function formatCreditsText(credits: TaxCredit[]): string {
  if (!credits || credits.length === 0) {
    return '이번 신고에서는 적용 가능한 세액공제가 없습니다.'
  }
  const names = credits
    .map((c) => (c.type === '직접 입력' ? c.custom_name || c.type : c.type))
    .filter(Boolean)
    .join(', ')
  const total = credits.reduce(
    (sum, c) => sum + (Number(c.current_amount) || 0) + (Number(c.carryover_amount) || 0),
    0
  )
  if (total === 0) {
    return `세액공제는 ${names}을(를) 검토하였으나 적용 가능한 금액이 없습니다.`
  }
  return `세액공제는 ${names} 총 ${total.toLocaleString('ko-KR')}원(이월공제 포함) 적용하였습니다.`
}

function formatReductionsText(reductions: TaxReduction[]): string {
  if (!reductions || reductions.length === 0) {
    return '세액감면은 적용 항목이 없습니다.'
  }
  const names = reductions
    .map((r) => (r.type === '직접 입력' ? r.custom_name || r.type : r.type))
    .filter(Boolean)
    .join(', ')
  const total = reductions.reduce((sum, r) => sum + (Number(r.current_amount) || 0), 0)
  if (total === 0) {
    return `세액감면은 ${names}을(를) 검토하였으나 적용 가능한 금액이 없습니다.`
  }
  return `세액감면은 ${names} 총 ${total.toLocaleString('ko-KR')}원 적용하였습니다.`
}
