/**
 * 2025년 종합소득세 누진세율 (소득세법 제55조).
 * 8단계 누진세율.
 */
const TAX_BRACKETS = [
  { upTo: 14_000_000,    rate: 0.06, deduct: 0 },
  { upTo: 50_000_000,    rate: 0.15, deduct: 1_260_000 },
  { upTo: 88_000_000,    rate: 0.24, deduct: 5_760_000 },
  { upTo: 150_000_000,   rate: 0.35, deduct: 15_440_000 },
  { upTo: 300_000_000,   rate: 0.38, deduct: 19_940_000 },
  { upTo: 500_000_000,   rate: 0.40, deduct: 25_940_000 },
  { upTo: 1_000_000_000, rate: 0.42, deduct: 35_940_000 },
  { upTo: Infinity,      rate: 0.45, deduct: 65_940_000 },
] as const

export interface IncomeTaxResult {
  tax: number    // 산출세액
  rate: number   // 적용세율 % (예: 6, 15, 24, ...)
  bracket: number
}

/**
 * 과세표준 → 산출세액 + 적용세율.
 * 누진공제 방식: 과세표준 × 세율 − 누진공제액
 *
 * 검증: calculateIncomeTax(7_872_391) → { tax: 472_343, rate: 6, bracket: 0 }
 *   7,872,391 × 0.06 = 472,343.46 → floor → 472,343 ✓
 */
export function calculateIncomeTax(taxBase: number): IncomeTaxResult {
  if (taxBase <= 0) return { tax: 0, rate: 0, bracket: 0 }

  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const bracket = TAX_BRACKETS[i]
    if (taxBase <= bracket.upTo) {
      const tax = Math.floor(taxBase * bracket.rate - bracket.deduct)
      return { tax: Math.max(0, tax), rate: bracket.rate * 100, bracket: i }
    }
  }

  return { tax: 0, rate: 0, bracket: 0 }
}
