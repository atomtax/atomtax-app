'use client'

/** 천단위 콤마 자동 입력 (계산기 전용 — DB 코드 import 없음) */

function formatWithCommas(value: number | string): string {
  if (value === null || value === undefined || value === '' || value === 0 || value === '0') {
    return ''
  }
  const num = typeof value === 'string' ? Number(value.replace(/,/g, '')) : value
  if (!Number.isFinite(num)) return ''
  return num.toLocaleString('ko-KR')
}

function parseFromCommas(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[^\d.-]/g, '').trim()
  if (!cleaned) return 0
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : 0
}

interface Props {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  id?: string
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  className,
  id,
}: Props) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={formatWithCommas(value)}
      onChange={(e) => onChange(parseFromCommas(e.target.value))}
      placeholder={placeholder}
      className={
        className ??
        'w-full px-3 py-2 border border-gray-200 rounded-lg text-right tabular-nums focus:border-indigo-500 focus:outline-none text-sm'
      }
    />
  )
}

interface DecimalProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  id?: string
  precision?: number
}

/** 소수점 허용 면적 입력 */
export function DecimalInput({
  value,
  onChange,
  placeholder,
  className,
  id,
  precision = 4,
}: DecimalProps) {
  const re = new RegExp(`^\\d*(?:\\.\\d{0,${precision}})?$`)

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={value === 0 ? '' : String(value)}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '' || re.test(raw)) {
          onChange(raw === '' || raw === '.' ? 0 : Number(raw))
        }
      }}
      placeholder={placeholder}
      className={
        className ??
        'w-full px-3 py-2 border border-gray-200 rounded-lg text-right tabular-nums focus:border-indigo-500 focus:outline-none text-sm'
      }
    />
  )
}
