type Bracket = {
  upTo: number
  base: number
  excessRate: number
  excessFrom: number
}

// 법인 · 의료사업자 조정료
const CORPORATE_BRACKETS: Bracket[] = [
  { upTo: 100_000_000,              base:   500_000, excessRate: 0,       excessFrom: 0 },
  { upTo: 300_000_000,              base:   500_000, excessRate: 0.002,   excessFrom: 100_000_000 },
  { upTo: 500_000_000,              base:   900_000, excessRate: 0.002,   excessFrom: 300_000_000 },
  { upTo: 1_000_000_000,            base: 1_300_000, excessRate: 0.0015,  excessFrom: 500_000_000 },
  { upTo: 2_000_000_000,            base: 2_050_000, excessRate: 0.001,   excessFrom: 1_000_000_000 },
  { upTo: 3_000_000_000,            base: 3_050_000, excessRate: 0.0009,  excessFrom: 2_000_000_000 },
  { upTo: 4_000_000_000,            base: 3_950_000, excessRate: 0.0008,  excessFrom: 3_000_000_000 },
  { upTo: 5_000_000_000,            base: 4_750_000, excessRate: 0.0007,  excessFrom: 4_000_000_000 },
  { upTo: 7_000_000_000,            base: 5_450_000, excessRate: 0.0005,  excessFrom: 5_000_000_000 },
  { upTo: 10_000_000_000,           base: 6_450_000, excessRate: 0.0002,  excessFrom: 7_000_000_000 },
  { upTo: Number.POSITIVE_INFINITY, base: 7_050_000, excessRate: 0.0001,  excessFrom: 10_000_000_000 },
]

// 개인사업자 조정료
const INDIVIDUAL_BRACKETS: Bracket[] = [
  { upTo: 100_000_000,              base:   300_000, excessRate: 0,       excessFrom: 0 },
  { upTo: 300_000_000,              base:   300_000, excessRate: 0.0018,  excessFrom: 100_000_000 },
  { upTo: 500_000_000,              base:   660_000, excessRate: 0.0015,  excessFrom: 300_000_000 },
  { upTo: 1_000_000_000,            base:   960_000, excessRate: 0.001,   excessFrom: 500_000_000 },
  { upTo: 2_000_000_000,            base: 1_460_000, excessRate: 0.0008,  excessFrom: 1_000_000_000 },
  { upTo: 3_000_000_000,            base: 2_260_000, excessRate: 0.0006,  excessFrom: 2_000_000_000 },
  { upTo: 4_000_000_000,            base: 2_860_000, excessRate: 0.0003,  excessFrom: 3_000_000_000 },
  { upTo: 5_000_000_000,            base: 3_160_000, excessRate: 0.0003,  excessFrom: 4_000_000_000 },
  { upTo: 7_000_000_000,            base: 3_460_000, excessRate: 0.0003,  excessFrom: 5_000_000_000 },
  { upTo: 10_000_000_000,           base: 4_060_000, excessRate: 0.0002,  excessFrom: 7_000_000_000 },
  { upTo: Number.POSITIVE_INFINITY, base: 4_660_000, excessRate: 0.0001,  excessFrom: 10_000_000_000 },
]

/**
 * 수입(자산)금액으로 조정료 자동 계산 (정부지원금 포함).
 */
export function calculateAdjustmentFee(
  revenue: number,
  businessType: 'corporate' | 'individual'
): number {
  if (revenue <= 0) return 0
  const brackets = businessType === 'corporate' ? CORPORATE_BRACKETS : INDIVIDUAL_BRACKETS
  const bracket = brackets.find((b) => revenue < b.upTo) ?? brackets[brackets.length - 1]
  const excess = Math.max(0, revenue - bracket.excessFrom)
  return Math.round(bracket.base + excess * bracket.excessRate)
}

export function calculateSupplyAmount(input: {
  settlementFee: number
  adjustmentFee: number
  taxCreditAdditional: number
  faithfulReportFee: number
  discount: number
}): number {
  return Math.max(
    0,
    input.settlementFee +
      input.adjustmentFee +
      input.taxCreditAdditional +
      input.faithfulReportFee -
      input.discount
  )
}

export function calculateVAT(supplyAmount: number): number {
  return Math.round(supplyAmount * 0.1)
}

export function calculateTotalAmount(supplyAmount: number, vatAmount: number): number {
  return supplyAmount + vatAmount
}

export function splitFeeIntoSettlementAndAdjustment(totalFee: number): {
  settlementFee: number
  adjustmentFee: number
} {
  const settlementFee = Math.round(totalFee / 2)
  const adjustmentFee = totalFee - settlementFee
  return { settlementFee, adjustmentFee }
}

export function calculateInvoiceRow(input: {
  revenue: number
  businessType: 'corporate' | 'individual'
  taxCreditAdditional: number
  faithfulReportFee: number
  discount: number
}): {
  settlementFee: number
  adjustmentFee: number
  supplyAmount: number
  vatAmount: number
  totalAmount: number
} {
  const totalAutoFee = calculateAdjustmentFee(input.revenue, input.businessType)
  const { settlementFee, adjustmentFee } = splitFeeIntoSettlementAndAdjustment(totalAutoFee)
  const supplyAmount = calculateSupplyAmount({
    settlementFee,
    adjustmentFee,
    taxCreditAdditional: input.taxCreditAdditional,
    faithfulReportFee: input.faithfulReportFee,
    discount: input.discount,
  })
  const vatAmount = calculateVAT(supplyAmount)
  const totalAmount = calculateTotalAmount(supplyAmount, vatAmount)
  return { settlementFee, adjustmentFee, supplyAmount, vatAmount, totalAmount }
}

export function calculateFinalFee(input: {
  settlementFee: number
  adjustmentFee: number
  taxCreditAdditional: number
  faithfulReportFee: number
  discount: number
}): number {
  return Math.max(
    0,
    input.settlementFee +
      input.adjustmentFee +
      input.taxCreditAdditional +
      input.faithfulReportFee -
      input.discount
  )
}

export type FeeScheduleRow = {
  range: string
  corporate: string
  individual: string
}

export const FEE_SCHEDULE_TABLE: FeeScheduleRow[] = [
  { range: '1억 미만',             corporate: '500,000',                          individual: '300,000' },
  { range: '1억 이상 3억 미만',     corporate: '500,000 + 1억 초과 × 0.20%',      individual: '300,000 + 1억 초과 × 0.18%' },
  { range: '3억 이상 5억 미만',     corporate: '900,000 + 3억 초과 × 0.20%',      individual: '660,000 + 3억 초과 × 0.15%' },
  { range: '5억 이상 10억 미만',    corporate: '1,300,000 + 5억 초과 × 0.15%',    individual: '960,000 + 5억 초과 × 0.10%' },
  { range: '10억 이상 20억 미만',   corporate: '2,050,000 + 10억 초과 × 0.10%',   individual: '1,460,000 + 10억 초과 × 0.08%' },
  { range: '20억 이상 30억 미만',   corporate: '3,050,000 + 20억 초과 × 0.09%',   individual: '2,260,000 + 20억 초과 × 0.06%' },
  { range: '30억 이상 40억 미만',   corporate: '3,950,000 + 30억 초과 × 0.08%',   individual: '2,860,000 + 30억 초과 × 0.03%' },
  { range: '40억 이상 50억 미만',   corporate: '4,750,000 + 40억 초과 × 0.07%',   individual: '3,160,000 + 40억 초과 × 0.03%' },
  { range: '50억 이상 70억 미만',   corporate: '5,450,000 + 50억 초과 × 0.05%',   individual: '3,460,000 + 50억 초과 × 0.03%' },
  { range: '70억 이상 100억 미만',  corporate: '6,450,000 + 70억 초과 × 0.02%',   individual: '4,060,000 + 70억 초과 × 0.02%' },
  { range: '100억 이상',            corporate: '7,050,000 + 100억 초과 × 0.01%',  individual: '4,660,000 + 100억 초과 × 0.01%' },
]
