'use client'

import type { TraderProgressStatus } from '@/types/database'
import type { ChecklistRowData } from '../types'
import { ChecklistRow } from './ChecklistRow'

interface Props {
  rows: ChecklistRowData[]
  onStatusChange: (propertyId: string, status: TraderProgressStatus) => void
}

export function InProgressSection({ rows, onStatusChange }: Props) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-800">
          🔄 진행중인 항목{' '}
          <span className="text-gray-500 font-normal">({rows.length}건)</span>
        </h2>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">담당자</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">고객사명</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">물건명</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">양도일</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">신고기한</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">진행단계</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">폴더</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">상세페이지</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700">보고서</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  해당 조건에 진행중인 항목이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <ChecklistRow
                  key={r.property.id}
                  row={r}
                  onStatusChange={onStatusChange}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
