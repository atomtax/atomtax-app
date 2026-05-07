/**
 * 전화번호를 하이픈 포맷으로 변환.
 * 입력 중에는 호출 안 함 — onBlur 시점에만.
 * 인식 못 한 패턴은 원본 그대로 반환.
 */
export function formatPhoneNumber(input: string | null | undefined): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''

  // 휴대폰 11자리: 010-XXXX-XXXX
  if (/^01[016789]/.test(digits) && digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  // 휴대폰 10자리 (구형): 010-XXX-XXXX
  if (/^01[016789]/.test(digits) && digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  // 서울 02, 9자리: 02-XXX-XXXX
  if (digits.startsWith('02') && digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
  }
  // 서울 02, 10자리: 02-XXXX-XXXX
  if (digits.startsWith('02') && digits.length === 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  // 기타 지역번호 0XX, 10자리: 0XX-XXX-XXXX
  if (/^0[3-9][0-9]/.test(digits) && digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  // 기타 지역번호 0XX, 11자리: 0XX-XXXX-XXXX
  if (/^0[3-9][0-9]/.test(digits) && digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  return input
}

/**
 * 사업자등록번호 3-2-5 포맷.
 * 10자리 숫자가 아니면 원본 반환.
 */
export function formatBusinessNumberForSave(input: string | null | undefined): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')
  if (digits.length !== 10) return input
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

/**
 * 주민등록번호 6-7 포맷.
 * 13자리 숫자가 아니면 원본 반환.
 */
export function formatResidentNumber(input: string | null | undefined): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')
  if (digits.length !== 13) return input
  return `${digits.slice(0, 6)}-${digits.slice(6)}`
}

/**
 * 법인등록번호 6-7 포맷 (주민번호와 동일 형식).
 */
export function formatCorporateNumber(input: string | null | undefined): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')
  if (digits.length !== 13) return input
  return `${digits.slice(0, 6)}-${digits.slice(6)}`
}
