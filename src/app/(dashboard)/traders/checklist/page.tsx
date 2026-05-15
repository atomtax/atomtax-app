import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'
import { getChecklistData, getChecklistFilterOptions } from '@/lib/db/checklist'
import { ChecklistClient } from './ChecklistClient'

export const metadata: Metadata = {
  title: '매매사업자 체크리스트',
}

export default async function ChecklistPage() {
  const [rows, options] = await Promise.all([
    getChecklistData(),
    getChecklistFilterOptions(),
  ])

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={24} className="text-indigo-600" />
            매매사업자 체크리스트
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            신고기한 임박 물건을 담당자/년월 단위로 관리합니다.
          </p>
        </div>
      </div>

      <ChecklistClient initialRows={rows} options={options} />
    </div>
  )
}
