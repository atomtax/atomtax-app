/**
 * 손익계산서 행 라벨 — 이익/손실 부호에 따라 동적 표기 (PR #102).
 *
 * 회계 관례:
 *   양수: "영업이익" / "차감전 이익" / "당기순이익"
 *   음수: "영업손실" / "차감전 손실" / "당기순손실"
 *
 * 사용 위치: 손익계산서 요약 표(UI/PDF) + 한줄 요약 등.
 */

import type { IncomeStatementSummary } from '@/types/database'

type LossAwareKey = 'operating_income' | 'pretax_income' | 'net_income'

const LABELS: Record<LossAwareKey, { profit: string; loss: string }> = {
  operating_income: { profit: '영업이익', loss: '영업손실' },
  pretax_income: {
    profit: '법인세차감전이익',
    loss: '법인세차감전손실',
  },
  net_income: { profit: '당기순이익', loss: '당기순손실' },
}

/** 손익계산서 필드의 값에 따라 이익/손실 라벨 반환 (Roman numeral 미포함) */
export function getIncomeStatementLabel(
  key: LossAwareKey,
  value: number | null | undefined,
): string {
  const v = Number(value ?? 0)
  const isLoss = v < 0
  return isLoss ? LABELS[key].loss : LABELS[key].profit
}

/** Roman numeral 접두사 포함 라벨 (예: "Ⅴ. 영업손실") */
export function getIncomeStatementLabelWithRoman(
  key: LossAwareKey,
  value: number | null | undefined,
  roman: string,
): string {
  return `${roman}. ${getIncomeStatementLabel(key, value)}`
}

/**
 * 금액 표시 (회계 관례 — 음수는 △ 접두).
 *   양수/0: "1,234,567"
 *   음수:   "△ 1,234,567"
 *   null:   ""
 */
export function formatIncomeAmount(value: number | null | undefined): string {
  if (value == null) return ''
  if (value < 0) return `△ ${Math.abs(value).toLocaleString('ko-KR')}`
  return value.toLocaleString('ko-KR')
}

/** 어떤 키가 손실 부호 인식 대상인지 */
export function isLossAwareKey(
  key: keyof IncomeStatementSummary,
): key is LossAwareKey {
  return key === 'operating_income' || key === 'pretax_income' || key === 'net_income'
}
