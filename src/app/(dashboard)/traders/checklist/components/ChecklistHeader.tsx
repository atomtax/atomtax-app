'use client'

import type { ChecklistFilterOptions } from '../types'

interface Props {
  manager: string
  yearMonth: string
  options: ChecklistFilterOptions
  onManagerChange: (manager: string) => void
  onYearMonthChange: (yearMonth: string) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function ChecklistHeader(_: Props) {
  return <div className="bg-white border border-gray-200 rounded-lg p-4">헤더 준비 중</div>
}
