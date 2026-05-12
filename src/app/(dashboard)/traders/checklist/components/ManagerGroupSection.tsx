'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  filterByMonth,
  formatYearMonthLabel,
  getCurrentYearMonth,
  groupByManager,
  shiftYearMonth,
} from '@/lib/utils/checklist-filter'
import type { ChecklistRowData } from '../types'
import { ManagerGroupCard } from './ManagerGroupCard'

interface Props {
  allRows: ChecklistRowData[]
  yearMonth: string
  onYearMonthChange: (yearMonth: string) => void
}

export function ManagerGroupSection({ allRows, yearMonth, onYearMonthChange }: Props) {
  // 선택 년월 + 신고완료 제외 + 담당자별 그룹
  const groups = useMemo(() => {
    const inMonth = filterByMonth(allRows, yearMonth)
    const inProgress = inMonth.filter(
      (r) => r.property.progress_status !== '신고완료',
    )
    return groupByManager(inProgress)
  }, [allRows, yearMonth])

  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-800">👥 담당자별 리스트</h2>
          <button
            type="button"
            onClick={() => onYearMonthChange(shiftYearMonth(yearMonth, -1))}
            className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded"
            title="이전 달"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-sm font-medium text-gray-900 min-w-[100px] text-center">
            {formatYearMonthLabel(yearMonth)}
          </span>
          <button
            type="button"
            onClick={() => onYearMonthChange(shiftYearMonth(yearMonth, 1))}
            className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded"
            title="다음 달"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => onYearMonthChange(getCurrentYearMonth())}
            className="px-2 py-0.5 text-xs text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200"
          >
            오늘
          </button>
        </div>
        <span className="text-xs text-gray-500">신고완료된 항목은 제외됩니다.</span>
      </header>

      <div className="p-4">
        {groups.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            이번 달 신고 예정 물건이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.map((g) => (
              <ManagerGroupCard key={g.manager} manager={g.manager} rows={g.rows} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
