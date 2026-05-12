'use client'

import { ChevronLeft, ChevronRight, Download, RefreshCw, Upload } from 'lucide-react'
import {
  formatYearMonthLabel,
  shiftYearMonth,
} from '@/lib/utils/checklist-filter'
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

export function ChecklistHeader({
  manager,
  yearMonth,
  options,
  onManagerChange,
  onYearMonthChange,
  onRefresh,
  isRefreshing,
}: Props) {
  const minYM = options.yearMonths[0] ?? yearMonth
  const maxYM =
    options.yearMonths[options.yearMonths.length - 1] ?? yearMonth

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-600 whitespace-nowrap">담당자</label>
        <select
          value={manager}
          onChange={(e) => onManagerChange(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="전체">담당자 전체</option>
          {options.managers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <label className="text-xs font-medium text-gray-600 whitespace-nowrap mr-1">
          신고기한
        </label>
        <button
          type="button"
          onClick={() => onYearMonthChange(shiftYearMonth(yearMonth, -1))}
          disabled={yearMonth <= minYM}
          aria-label="이전 월"
          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <select
          value={yearMonth}
          onChange={(e) => onYearMonthChange(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
        >
          {options.yearMonths.map((ym) => (
            <option key={ym} value={ym}>
              {formatYearMonthLabel(ym)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onYearMonthChange(shiftYearMonth(yearMonth, 1))}
          disabled={yearMonth >= maxYM}
          aria-label="다음 월"
          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        disabled
        title="추후 작업 예정"
        className="px-3 py-2 bg-gray-100 text-gray-500 text-sm rounded flex items-center gap-1 cursor-not-allowed"
      >
        <Upload size={14} /> 서류업로드
      </button>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        title="최신 데이터를 다시 가져옵니다"
        className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm rounded flex items-center gap-1 disabled:opacity-50"
      >
        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> 동기화
      </button>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        title="현재 필터로 데이터를 불러옵니다"
        className="px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 text-sm rounded flex items-center gap-1 disabled:opacity-50"
      >
        <Download size={14} /> 불러오기
      </button>
    </div>
  )
}
