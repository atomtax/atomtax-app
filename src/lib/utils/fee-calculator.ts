/**
 * 법인 결산조정료 보수기준표
 */
export function calculateCorporateSettlementFee(revenue: number): number {
  const r = revenue
  if (r <= 100_000_000) return 500_000
  if (r <= 300_000_000) return 500_000 + (r - 100_000_000) * 0.002
  if (r <= 500_000_000) return 900_000 + (r - 300_000_000) * 0.002
  if (r <= 1_000_000_000) return 1_300_000 + (r - 500_000_000) * 0.0015
  if (r <= 3_000_000_000) return 2_050_000 + (r - 1_000_000_000) * 0.001
  if (r <= 5_000_000_000) return 4_050_000 + (r - 3_000_000_000) * 0.0008
  if (r <= 10_000_000_000) return 5_650_000 + (r - 5_000_000_000) * 0.0006
  return 8_650_000 + (r - 10_000_000_000) * 0.0004
}

/**
 * 법인세 계산 (과세표준 기준)
 * 2억 이하: 9%, 2억~200억: 19%, 200억~3000억: 21%, 3000억 초과: 24%
 */
export function calculateCorporateTax(taxableIncome: number): number {
  const t = taxableIncome
  if (t <= 200_000_000) return t * 0.09
  if (t <= 20_000_000_000) return 18_000_000 + (t - 200_000_000) * 0.19
  if (t <= 300_000_000_000) return 3_762_000_000 + (t - 20_000_000_000) * 0.21
  return 59_562_000_000 + (t - 300_000_000_000) * 0.24
}

export function calculateLocalTax(corporateTax: number): number {
  return Math.floor(corporateTax * 0.1)
}
