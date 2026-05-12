'use client'

import type { ChecklistRowData } from '../types'

interface Props {
  allRows: ChecklistRowData[]
  yearMonth: string
  onYearMonthChange: (yearMonth: string) => void
}

export function ManagerGroupSection(_: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">담당자별 리스트 준비 중</div>
  )
}
