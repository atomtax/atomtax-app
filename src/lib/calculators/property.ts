import type { TraderExpenseCategory } from '@/types/database'

/**
 * 양도소득 = 차감 후 양도가액 − 취득가액 − 기타필요경비.
 *           = (transfer_amount - vat_amount) - 취득 - 기타
 * 양도가액이 0 이하면(미양도) 0 반환 — 마이너스 양도소득 방지.
 * vat_amount=0이면 차감 후 = 양도가액 그대로 (기존 데이터 호환성).
 */
export function calculateTransferIncome(
  transferAmount: number,
  vatAmount: number,
  acquisitionAmount: number,
  otherExpenses: number,
): number {
  const transfer = Number(transferAmount) || 0
  if (transfer <= 0) return 0
  const vat = Number(vatAmount) || 0
  const acquisition = Number(acquisitionAmount) || 0
  const other = Number(otherExpenses) || 0
  return transfer - vat - acquisition - other
}

/**
 * 신고기한: 양도일이 속한 달의 말일 + 2개월
 * 예: 2025-04-05 양도 → 2025-04-30 + 2개월 = 2025-06-30
 *     2025-12-25 양도 → 2025-12-31 + 2개월 = 2026-02-28 (2026 평년)
 */
export function calculateFilingDeadline(transferDate: string | null | undefined): string | null {
  if (!transferDate) return null

  const trimmed = transferDate.trim()
  if (!trimmed) return null

  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return null

  const year = d.getFullYear()
  const month = d.getMonth()

  // 양도일 속한 달의 말일: 다음 달의 0일 = 이번 달의 말일
  const endOfMonth = new Date(year, month + 1, 0)

  // 말일 + 2개월
  const targetYear = endOfMonth.getFullYear()
  const targetMonth = endOfMonth.getMonth() + 2
  // 해당 월의 말일로 정규화 (2개월 뒤 같은 일자가 존재하지 않으면 말일로)
  const result = new Date(targetYear, targetMonth + 1, 0)

  const yyyy = result.getFullYear()
  const mm = String(result.getMonth() + 1).padStart(2, '0')
  const dd = String(result.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export interface ExpenseAggregateInput {
  category: TraderExpenseCategory | string
  amount: number
  predeclaration_allowed: boolean
}

/**
 * 필요경비 항목 → 취득가액/기타필요경비 합산
 * - 예정신고 비용인정(predeclaration_allowed)된 항목만 합산
 * - category에 따라 acquisition_amount 또는 other_expenses로 분기
 */
export function aggregateExpenses(expenses: ExpenseAggregateInput[]): {
  acquisition_amount: number
  other_expenses: number
} {
  let acquisition_amount = 0
  let other_expenses = 0

  for (const e of expenses) {
    if (!e.predeclaration_allowed) continue
    const amount = Number(e.amount) || 0
    if (e.category === '취득가액') {
      acquisition_amount += amount
    } else if (e.category === '기타필요경비') {
      other_expenses += amount
    }
  }

  return { acquisition_amount, other_expenses }
}
