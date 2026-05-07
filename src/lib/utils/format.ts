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

/**
 * 엑셀 시리얼 숫자 / Date 객체 / 다양한 텍스트 포맷을 YYYY-MM 문자열로 정규화.
 * 인식하지 못한 패턴은 원본 그대로 반환.
 */
export function normalizeBillingMonth(
  value: string | number | Date | null | undefined
): string {
  if (value == null || value === '') return ''

  // Date 객체
  if (value instanceof Date) {
    const year = value.getUTCFullYear()
    const month = String(value.getUTCMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  const str = String(value).trim()
  if (!str) return ''

  // 이미 YYYY-MM 또는 YYYY/MM 또는 YYYY.MM
  const ymMatch = str.match(/^(\d{4})[-/.](\d{1,2})$/)
  if (ymMatch) {
    return `${ymMatch[1]}-${ymMatch[2].padStart(2, '0')}`
  }

  // YYYY년 MM월
  const krMatch = str.match(/^(\d{4})년\s*(\d{1,2})월$/)
  if (krMatch) {
    return `${krMatch[1]}-${krMatch[2].padStart(2, '0')}`
  }

  // 순수 숫자 → 엑셀 시리얼 (10000 이상)
  if (/^\d+$/.test(str)) {
    const serial = Number(str)
    if (serial >= 10000) {
      const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400 * 1000)
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      return `${year}-${month}`
    }
  }

  return str
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
