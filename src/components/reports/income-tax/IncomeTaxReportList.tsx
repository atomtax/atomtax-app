import type { IncomeClientWithReport } from '@/types/database'
import { IncomeTaxReportCard } from './IncomeTaxReportCard'

interface Props {
  items: IncomeClientWithReport[]
  year: number
}

export function IncomeTaxReportList({ items, year }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 bg-white rounded-lg border border-gray-200">
        조건에 맞는 개인 고객이 없습니다.
      </div>
    )
  }

  const grouped = new Map<string, IncomeClientWithReport[]>()
  for (const item of items) {
    const key = item.client.manager?.trim() || '미배정'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(item)
  }

  const sorted = Array.from(grouped.entries()).sort(([a], [b]) => {
    if (a === '미배정') return 1
    if (b === '미배정') return -1
    return a.localeCompare(b, 'ko')
  })

  return (
    <div className="space-y-6">
      {sorted.map(([manager, list]) => {
        const completed = list.filter((i) => i.report?.status === 'completed').length
        return (
          <section key={manager} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <header
              className="px-5 py-3 flex items-center justify-between text-white"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <h2 className="text-base font-semibold">👤 {manager}</h2>
              <span className="text-sm opacity-90">
                {list.length}개 (완료 {completed}개)
              </span>
            </header>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {list.map((item) => (
                <IncomeTaxReportCard key={item.client.id} item={item} year={year} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
