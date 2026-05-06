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
