/**
 * 사용자가 8자리(20250515) 또는 6자리(250515) 숫자를 입력하면 YYYY-MM-DD로 변환.
 * 이미 YYYY-MM-DD 형식이면 그대로 반환. 변환 불가능하면 원본 그대로 반환.
 */
export function autoFormatDate(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null

  // 이미 YYYY-MM-DD 형식이면 그대로
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // 숫자만 추출
  const digits = trimmed.replace(/\D/g, '')

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }

  if (digits.length === 6) {
    return `20${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`
  }

  // 그 외는 원본 그대로 반환 (사용자 입력 보존)
  return trimmed
}

/** ISO YYYY-MM-DD 형식 + 실제로 존재하는 날짜인지 검증 */
export function isValidIsoDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const d = new Date(dateStr)
  return !Number.isNaN(d.getTime())
}
