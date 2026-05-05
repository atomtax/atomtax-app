type Bracket = { upTo: number; rate: number }

// 2025년 사업연도 법인세율
const RATES_2025: Bracket[] = [
  { upTo: 200_000_000,              rate: 0.09 },
  { upTo: 20_000_000_000,           rate: 0.19 },
  { upTo: 300_000_000_000,          rate: 0.21 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.24 },
]

// 2026년 사업연도 법인세율 (1%p 인상)
const RATES_2026: Bracket[] = [
  { upTo: 200_000_000,              rate: 0.10 },
  { upTo: 20_000_000_000,           rate: 0.20 },
  { upTo: 300_000_000_000,          rate: 0.22 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.25 },
]

function getRates(year: number): Bracket[] {
  return year >= 2026 ? RATES_2026 : RATES_2025
}

/**
 * 법인세 산출 — 누진세율 적용.
 * @param taxableIncome 과세표준 (이월결손금 등 차감 후)
 * @param year 사업연도
 */
export function calculateCorporateTax(
  taxableIncome: number,
  year: number = new Date().getFullYear()
): number {
  if (taxableIncome <= 0) return 0
  const rates = getRates(year)

  let remaining = taxableIncome
  let prev = 0
  let total = 0

  for (const b of rates) {
    if (remaining <= 0) break
    const slice = Math.min(remaining, b.upTo - prev)
    total += slice * b.rate
    remaining -= slice
    prev = b.upTo
  }
  return Math.round(total)
}

/** 지방소득세 = 법인세의 10% */
export function calculateLocalTax(corporateTax: number): number {
  return Math.round(corporateTax * 0.1)
}

/** 농어촌특별세 = 감면받은 세액공제의 20% */
export function calculateRuralTax(taxCreditAmount: number): number {
  if (taxCreditAmount <= 0) return 0
  return Math.round(taxCreditAmount * 0.2)
}
