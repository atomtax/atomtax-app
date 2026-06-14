'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { markReviewedAction } from './actions'
import type { ClosingChange } from '@/types/database'

/** YYYYMMDDHHMMSS → 'YYYY-MM-DD HH:MM' */
function formatRaw(raw: string | null): string {
  if (!raw) return '—'
  const d = raw.replace(/\D/g, '')
  if (d.length < 12) return raw
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)} ${d.slice(8, 10)}:${d.slice(10, 12)}`
}

export default function ClosingChangesList({
  changes,
  selectedId,
}: {
  changes: ClosingChange[]
  selectedId?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleReview = (id: string) => {
    startTransition(async () => {
      await markReviewedAction(id)
      router.refresh()
    })
  }

  if (changes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
        확인할 마감 변화가 없습니다.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
      {changes.map((c) => {
        const isNew = c.change_type === 'new_closed'
        const isSelected = c.id === selectedId
        return (
          <div
            key={c.id}
            className={`flex items-center gap-3 px-4 py-3 ${isSelected ? 'bg-brand/5' : ''}`}
          >
            <Link
              href={`/atom-lab/closing?change=${c.id}`}
              className="flex-1 min-w-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">
                  {c.company_name ?? c.business_number}
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                    isNew
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {isNew ? '🆕 신규마감' : '🔄 재마감'}
                </span>
                {c.period && (
                  <span className="shrink-0 text-xs text-gray-500">{c.period}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {c.change_type === 're_closed' && (
                  <span className="tabular-nums">
                    {formatRaw(c.prev_closed_at)} → </span>
                )}
                <span className="tabular-nums">{formatRaw(c.curr_closed_at)}</span>
              </div>
            </Link>
            <button
              onClick={() => handleReview(c.id)}
              disabled={isPending}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              확인 완료
            </button>
          </div>
        )
      })}
    </div>
  )
}
