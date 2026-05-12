'use client'

import type { TraderProgressStatus } from '@/types/database'
import type { ChecklistRowData } from '../types'

interface Props {
  rows: ChecklistRowData[]
  onStatusChange: (propertyId: string, status: TraderProgressStatus) => void
}

export function InProgressSection(_: Props) {
  return <div className="bg-white border border-gray-200 rounded-lg p-4">진행중 섹션 준비 중</div>
}
