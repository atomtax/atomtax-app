'use client'

import { useTransition } from 'react'
import { updateProgressStatus } from '@/app/actions/checklist'
import {
  PROGRESS_OPTIONS,
  PROGRESS_STYLES,
} from '@/lib/constants/property-progress'
import type { TraderProgressStatus } from '@/types/database'

interface Props {
  propertyId: string
  value: TraderProgressStatus
  /** 낙관적 업데이트 콜백 — ChecklistClient의 state를 즉시 변경 */
  onChange: (propertyId: string, status: TraderProgressStatus) => void
}

export function ProgressStatusSelect({ propertyId, value, onChange }: Props) {
  const [isPending, startTransition] = useTransition()
  const style = PROGRESS_STYLES[value]

  function handleChange(next: TraderProgressStatus) {
    if (next === value) return
    const prev = value

    // 1. 낙관적 업데이트
    onChange(propertyId, next)

    // 2. 서버 액션
    startTransition(async () => {
      const result = await updateProgressStatus(propertyId, next)
      if (!result.success) {
        // 3. 실패 시 롤백 + 조용한 에러 로그
        onChange(propertyId, prev)
        console.error('진행단계 저장 실패:', result.error)
      }
    })
  }

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as TraderProgressStatus)}
      className={`px-2 py-1 border rounded text-xs focus:border-indigo-500 focus:outline-none ${style.bg} ${style.text} ${style.border} disabled:opacity-60`}
    >
      {PROGRESS_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}
