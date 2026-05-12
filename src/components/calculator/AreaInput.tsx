'use client'

import { useEffect, useState } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
  placeholder?: string
  className?: string
}

const DECIMALS = 2

function formatWithCommas(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return ''
  const factor = Math.pow(10, decimals)
  const rounded = Math.round(value * factor) / factor
  return rounded.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * 면적 입력 — 천단위 콤마 + 소수점 2자리.
 * - 포커스 중에는 raw 값 그대로 편집 가능
 * - 블러 시 포맷팅 (예: 1,234.56)
 */
export function AreaInput({ value, onChange, placeholder, className }: Props) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  // 외부 value 변경 시 동기화 (포커스 중이 아닐 때만)
  useEffect(() => {
    if (!focused) {
      setText(value === 0 ? '' : formatWithCommas(value, DECIMALS))
    }
  }, [value, focused])

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={() => {
        setFocused(true)
        setText(value === 0 ? '' : String(value))
      }}
      onChange={(e) => {
        const raw = e.target.value
        const cleaned = raw.replace(/[^0-9.,]/g, '')
        setText(cleaned)
        const stripped = cleaned.replace(/,/g, '')
        if (stripped === '' || stripped === '.') {
          onChange(0)
        } else {
          const n = Number(stripped)
          if (Number.isFinite(n)) onChange(n)
        }
      }}
      onBlur={() => {
        setFocused(false)
        setText(value === 0 ? '' : formatWithCommas(value, DECIMALS))
      }}
      placeholder={placeholder}
      className={
        className ??
        'w-full px-3 py-2 border border-gray-200 rounded-lg text-right tabular-nums focus:border-indigo-500 focus:outline-none text-sm'
      }
    />
  )
}
