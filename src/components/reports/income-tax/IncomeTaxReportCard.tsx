import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import type { IncomeClientWithReport } from '@/types/database'

interface Props {
  item: IncomeClientWithReport
  year: number
}

export function IncomeTaxReportCard({ item, year }: Props) {
  const { client, report } = item
  const isCompleted = report?.status === 'completed'
  const isDraft = report?.status === 'draft'

  return (
    <Link
      href={`/reports/income-tax/${client.id}?year=${year}`}
      className={`
        block px-4 py-3 rounded-lg border text-center text-sm font-medium
        transition-all hover:shadow-md hover:-translate-y-0.5
        ${isCompleted
          ? 'bg-green-50 border-green-300 text-green-900'
          : isDraft
          ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
          : 'bg-white border-gray-200 text-gray-800 hover:border-indigo-300'}
      `}
    >
      <div className="flex items-center justify-center gap-1">
        {isCompleted && <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />}
        <span className="truncate">{client.company_name}</span>
      </div>
    </Link>
  )
}
