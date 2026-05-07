export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-'
  return value.toLocaleString('ko-KR')
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return value.toLocaleString('ko-KR') + '원'
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  return value.slice(0, 10)
}

/** 쉼표 포함 문자열 → 숫자로 변환 */
export function parseNumberInput(value: string): number {
  const n = parseInt(value.replace(/,/g, '').replace(/원$/, ''), 10)
  return isNaN(n) ? 0 : n
}

export function formatBusinessNumber(value: string | null | undefined): string {
  if (!value) return '-'
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }
  return value
}

/** 금액 표시 (null → '') */
export function formatAmount(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('ko-KR')
}

/** D-day 계산: 오늘 기준 남은 일수 (음수=초과) */
export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** 취득일~양도일 보유 기간 표시 */
export function formatHoldingPeriod(
  acquisitionDate: string | null | undefined,
  transferDate: string | null | undefined
): string {
  if (!acquisitionDate) return ''
  const start = new Date(acquisitionDate)
  const end = transferDate ? new Date(transferDate) : new Date()
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return ''
  const years = Math.floor(diffDays / 365)
  const months = Math.floor((diffDays % 365) / 30)
  if (years > 0 && months > 0) return `${years}년 ${months}개월`
  if (years > 0) return `${years}년`
  return `${months}개월`
}
