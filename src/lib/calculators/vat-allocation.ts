/**
 * 매매사업자 건물분 부가가치세 안분 산식 (계산기 전용).
 *
 * 입력:
 *  - sellingPrice         매도예상가 (VAT 포함 총액, 원)
 *  - landArea             토지 면적 (㎡)
 *  - landUnitPrice        토지공시지가 (원/㎡)
 *  - buildingStandardValue 건물기준시가 (전체 금액, 원)
 *
 * 중간값:
 *  - 토지가액 = 토지공시지가 × 토지면적
 *  - 건물가액 = 건물기준시가
 *
 * 결과:
 *  - vatMarket            부가세 시가 (정상가)
 *                         = (매도가 × 건물가액) / (토지가액 + 건물가액 × 1.1) × 0.1
 *  - vatLow               부가세 최저가 = ceil(vatMarket × 0.7 / 10000) × 10000  (만단위 올림)
 *  - allocatedBuilding    분배 건물가액 = vatLow × 10
 *  - allocatedLand        분배 토지가액 = 매도가 - vatLow × 11
 *  - verifyTotal          allocatedLand + allocatedBuilding + vatLow (검증)
 */

export interface VatAllocationInput {
  sellingPrice: number
  landArea: number
  landUnitPrice: number
  buildingStandardValue: number
}

export interface VatAllocationResult {
  vatMarket: number
  vatLow: number
  allocatedLand: number
  allocatedBuilding: number
  verifyTotal: number
  isValid: boolean
}

export function calculateVatAllocation(
  input: VatAllocationInput,
): VatAllocationResult | null {
  const { sellingPrice, landArea, landUnitPrice, buildingStandardValue } = input

  if (
    sellingPrice <= 0 ||
    landArea <= 0 ||
    landUnitPrice <= 0 ||
    buildingStandardValue <= 0
  ) {
    return null
  }

  const landValue = landUnitPrice * landArea
  const buildingValue = buildingStandardValue
  const denominator = landValue + buildingValue * 1.1

  if (denominator <= 0) return null

  const vatMarket = (sellingPrice * buildingValue) / denominator * 0.1
  const vatLow = Math.ceil((vatMarket * 0.7) / 10000) * 10000
  const allocatedBuilding = vatLow * 10
  const allocatedLand = sellingPrice - vatLow * 11
  const verifyTotal = allocatedLand + allocatedBuilding + vatLow

  return {
    vatMarket,
    vatLow,
    allocatedLand,
    allocatedBuilding,
    verifyTotal,
    isValid: Math.abs(verifyTotal - sellingPrice) < 1,
  }
}
