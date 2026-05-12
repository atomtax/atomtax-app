'use client'

import {
  PROGRESS_OPTIONS,
  PROGRESS_STYLES,
} from '@/lib/constants/property-progress'
import type { TraderProgressStatus } from '@/types/database'

interface Props {
  propertyId: string
  value: TraderProgressStatus
  onChange: (propertyId: string, status: TraderProgressStatus) => void
}

export function ProgressStatusSelect({ propertyId, value, onChange }: Props) {
  const style = PROGRESS_STYLES[value]
  return (
    <select
      value={value}
      onChange={(e) => onChange(propertyId, e.target.value as TraderProgressStatus)}
      className={`px-2 py-1 border rounded text-xs focus:border-indigo-500 focus:outline-none ${style.bg} ${style.text} ${style.border}`}
    >
      {PROGRESS_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}
