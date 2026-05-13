'use client'

import { memo, useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Save,
} from 'lucide-react'
import { saveTraderReviewNotes } from '@/app/actions/trader-review'
import type {
  TraderReviewProperty,
  TraderReviewRow,
} from '@/lib/db/trader-review'

interface Props {
  initialRows: TraderReviewRow[]
  managers: string[]
  year: number
  manager?: string
}

interface EditableEntry {
  memo: string
  is_confirmed: boolean
}
type EditableState = Record<string, EditableEntry>

function fmt(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '-'
  return n.toLocaleString('ko-KR')
}

function fmtDate(d: string | null): string {
  return d ?? '-'
}

export function TraderReviewClient({
  initialRows,
  managers,
  year,
  manager,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editable, setEditable] = useState<EditableState>(() => {
    const init: EditableState = {}
    initialRows.forEach((r) => {
      init[r.client_id] = { memo: r.memo, is_confirmed: r.is_confirmed }
    })
    return init
  })

  const changedRows = useMemo(() => {
    const list: { client_id: string; memo: string; is_confirmed: boolean }[] =
      []
    initialRows.forEach((r) => {
      const edit = editable[r.client_id]
      if (!edit) return
      if (edit.memo !== r.memo || edit.is_confirmed !== r.is_confirmed) {
        list.push({
          client_id: r.client_id,
          memo: edit.memo,
          is_confirmed: edit.is_confirmed,
        })
      }
    })
    return list
  }, [editable, initialRows])

  const groupedByManager = useMemo(() => {
    const groups = new Map<string, TraderReviewRow[]>()
    initialRows.forEach((row) => {
      const mgr = row.manager || '(담당자 미지정)'
      const arr = groups.get(mgr) ?? []
      arr.push(row)
      groups.set(mgr, arr)
    })
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [initialRows])

  const navigate = useCallback(
    (next: { year?: number; manager?: string | null }) => {
      const params = new URLSearchParams()
      params.set('year', String(next.year ?? year))
      const m = next.manager === null ? undefined : next.manager ?? manager
      if (m) params.set('manager', m)
      startTransition(() => {
        router.push(`/reports-review/income-tax/trader?${params.toString()}`)
      })
    },
    [year, manager, router],
  )

  const handleSave = useCallback(async () => {
    if (changedRows.length === 0) return
    setSaving(true)
    try {
      const result = await saveTraderReviewNotes({ year, notes: changedRows })
      if (result.ok) {
        alert(`${changedRows.length}건 저장되었습니다.`)
        startTransition(() => router.refresh())
      } else {
        alert(`저장 실패: ${result.error}`)
      }
    } finally {
      setSaving(false)
    }
  }, [changedRows, year, router])

  const updateEditable = useCallback(
    (clientId: string, patch: Partial<EditableEntry>) => {
      setEditable((prev) => ({
        ...prev,
        [clientId]: { ...prev[clientId], ...patch },
      }))
    },
    [],
  )

  const toggleExpand = useCallback((clientId: string) => {
    setExpanded((prev) => (prev === clientId ? null : clientId))
  }, [])

  return (
    <>
      <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate({ year: year - 1 })}
              className="p-1.5 hover:bg-gray-100 rounded"
              title="이전 연도"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-medium px-3 min-w-[80px] text-center tabular-nums">
              {year}년
            </span>
            <button
              onClick={() => navigate({ year: year + 1 })}
              className="p-1.5 hover:bg-gray-100 rounded"
              title="다음 연도"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <select
            value={manager ?? ''}
            onChange={(e) =>
              navigate({ manager: e.target.value || null })
            }
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">전체 담당자</option>
            {managers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {isPending && (
            <span className="text-xs text-gray-500">로딩 중...</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={changedRows.length === 0 || saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2 text-sm"
        >
          <Save size={14} />
          {saving ? '저장 중...' : `저장${changedRows.length > 0 ? ` (${changedRows.length})` : ''}`}
        </button>
      </div>

      {groupedByManager.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          표시할 활성 매매사업자가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByManager.map(([mgr, rows]) => (
            <ManagerSection
              key={mgr}
              manager={mgr}
              rows={rows}
              year={year}
              expanded={expanded}
              onToggle={toggleExpand}
              editable={editable}
              onEditChange={updateEditable}
            />
          ))}
        </div>
      )}
    </>
  )
}

interface ManagerSectionProps {
  manager: string
  rows: TraderReviewRow[]
  year: number
  expanded: string | null
  onToggle: (clientId: string) => void
  editable: EditableState
  onEditChange: (clientId: string, patch: Partial<EditableEntry>) => void
}

const ManagerSection = memo(function ManagerSection({
  manager,
  rows,
  year,
  expanded,
  onToggle,
  editable,
  onEditChange,
}: ManagerSectionProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h2 className="font-semibold text-sm text-gray-800">
          {manager}{' '}
          <span className="text-xs font-normal text-gray-500 ml-1">
            ({rows.length}건)
          </span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-[11px] text-gray-600">
            <tr>
              <th className="px-2 py-2 text-left whitespace-nowrap">담당자</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">
                고객사명
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">매출액</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                매출원가
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                기말재고
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">종소세</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">지방세</th>
              <th className="px-2 py-2 text-left min-w-[160px]">메모</th>
              <th className="px-2 py-2 text-center w-14 whitespace-nowrap">
                확인
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TraderRowItem
                key={row.client_id}
                row={row}
                year={year}
                isExpanded={expanded === row.client_id}
                onToggle={onToggle}
                editable={editable[row.client_id]}
                onEditChange={onEditChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
})

interface TraderRowItemProps {
  row: TraderReviewRow
  year: number
  isExpanded: boolean
  onToggle: (clientId: string) => void
  editable: EditableEntry | undefined
  onEditChange: (clientId: string, patch: Partial<EditableEntry>) => void
}

const TraderRowItem = memo(function TraderRowItem({
  row,
  year,
  isExpanded,
  onToggle,
  editable,
  onEditChange,
}: TraderRowItemProps) {
  const hasProperties = row.properties.length > 0
  const muted = !hasProperties ? 'text-gray-400' : ''
  return (
    <>
      <tr
        className={`border-t border-gray-100 hover:bg-indigo-50/30 cursor-pointer ${muted}`}
        onClick={() => onToggle(row.client_id)}
      >
        <td className="px-2 py-2 whitespace-nowrap">{row.manager}</td>
        <td className="px-2 py-2 font-medium whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            {isExpanded ? (
              <ChevronUp size={11} className="text-gray-400" />
            ) : (
              <ChevronDown size={11} className="text-gray-400" />
            )}
            {row.company_name}
          </span>
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.total_revenue)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.total_cogs)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums text-amber-700">
          {fmt(row.ending_inventory)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.total_income_tax)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.total_local_tax)}
        </td>
        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editable?.memo ?? ''}
            onChange={(e) =>
              onEditChange(row.client_id, { memo: e.target.value })
            }
            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
            placeholder="메모"
          />
        </td>
        <td
          className="px-2 py-2 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={editable?.is_confirmed ?? false}
            onChange={(e) =>
              onEditChange(row.client_id, { is_confirmed: e.target.checked })
            }
            className="rounded"
          />
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-blue-50/50">
          <td colSpan={9} className="px-4 py-3 border-t border-blue-100">
            <TraderExpandedDetail row={row} year={year} />
          </td>
        </tr>
      )}
    </>
  )
})

function TraderExpandedDetail({
  row,
  year,
}: {
  row: TraderReviewRow
  year: number
}) {
  if (row.properties.length === 0) {
    return (
      <div className="text-sm text-gray-500">등록된 물건이 없습니다.</div>
    )
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-800">
        {row.company_name} — 전체 물건 ({row.properties.length}건, 취득일 순)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-200 rounded overflow-hidden bg-white">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-2 py-1.5 text-left whitespace-nowrap">분류</th>
              <th className="px-2 py-1.5 text-left">물건명</th>
              <th className="px-2 py-1.5 text-center whitespace-nowrap">
                취득일
              </th>
              <th className="px-2 py-1.5 text-center whitespace-nowrap">
                양도일
              </th>
              <th className="px-2 py-1.5 text-right whitespace-nowrap">
                양도가액
              </th>
              <th className="px-2 py-1.5 text-right whitespace-nowrap">
                취득가액
              </th>
              <th className="px-2 py-1.5 text-right whitespace-nowrap">
                종소세
              </th>
              <th className="px-2 py-1.5 text-right whitespace-nowrap">
                지방세
              </th>
            </tr>
          </thead>
          <tbody>
            {row.properties.map((p) => (
              <tr key={p.id} className="border-t border-gray-200">
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <PropertyBadge property={p} year={year} />
                </td>
                <td className="px-2 py-1.5 font-medium">{p.property_name}</td>
                <td className="px-2 py-1.5 text-center whitespace-nowrap">
                  {fmtDate(p.acquisition_date)}
                </td>
                <td className="px-2 py-1.5 text-center whitespace-nowrap">
                  {fmtDate(p.transfer_date)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {fmt(p.transfer_amount)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {fmt(p.acquisition_cost)}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {p.is_transferred_in_year ? fmt(p.prepaid_income_tax) : '-'}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {p.is_transferred_in_year ? fmt(p.prepaid_local_tax) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr className="border-t-2 border-gray-300">
              <td colSpan={4} className="px-2 py-1.5 text-right">
                합계 ({year}년)
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {fmt(row.total_revenue)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {fmt(row.total_cogs)}{' '}
                <span className="text-amber-700 font-normal">
                  / 기말재고 {fmt(row.ending_inventory)}
                </span>
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {fmt(row.total_income_tax)}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {fmt(row.total_local_tax)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function PropertyBadge({
  property,
  year,
}: {
  property: TraderReviewProperty
  year: number
}) {
  if (property.is_transferred_in_year) {
    return (
      <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded font-semibold">
        {year}년 양도
      </span>
    )
  }
  if (property.is_in_inventory) {
    return (
      <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded font-semibold">
        기말재고
      </span>
    )
  }
  return (
    <span className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-500 rounded">
      기타
    </span>
  )
}
