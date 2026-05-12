'use client'

import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'

export type AutoLookupStatus = 'idle' | 'looking' | 'success' | 'failed'

interface Props {
  status: AutoLookupStatus
}

export function AutoLookupBadge({ status }: Props) {
  if (status === 'idle') return null

  if (status === 'looking') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
        <RefreshCw size={11} className="animate-spin" /> 조회 중...
      </span>
    )
  }

  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
        <CheckCircle2 size={11} /> 자동 조회됨
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
      <AlertTriangle size={11} /> 자동 조회 실패
    </span>
  )
}
