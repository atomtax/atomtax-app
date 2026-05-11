/**
 * 숫자에 천단위 콤마: 1234567 → "1,234,567"
 * null/undefined/0은 빈 문자열
 */
export function formatNumberWithCommas(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === '' || value === 0 || value === '0') {
    return ''
  }

  const num = typeof value === 'string' ? Number(value.replace(/,/g, '')) : value
  if (!Number.isFinite(num)) return ''

  return num.toLocaleString('ko-KR')
}

/**
 * 콤마가 포함된 문자열을 숫자로: "1,234,567" → 1234567
 * 숫자가 아닌 문자는 무시 (콤마/공백 등 모두 제거)
 */
export function parseNumberFromCommas(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[^\d.-]/g, '').trim()
  if (!cleaned) return 0
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : 0
}
