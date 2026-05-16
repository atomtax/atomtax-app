'use client'

import { memo, useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Save,
} from 'lucide-react'
import { saveReviewNotes } from '@/app/actions/income-tax-review'
import type { ReviewRow } from '@/lib/db/income-tax-review'
import type { TaxCredit, TaxReduction } from '@/types/database'
import { getRegionZoneName } from '@/lib/data/regional-zones'
import { calculateStartupReductionRate } from '@/lib/utils/startup-tax-reduction'

interface Props {
  initialRows: ReviewRow[]
  managers: string[]
  year: number
  manager?: string
}

interface EditableEntry {
  memo: string
  is_confirmed: boolean
}
type EditableState = Record<string, EditableEntry>

function fmt(n: number | null): string {
  if (n == null) return '-'
  return n.toLocaleString('ko-KR')
}

interface StartupBadge {
  label: string
  tooltip: string
  className: string
}

function startupBadgeOf(row: ReviewRow, reportYear: number): StartupBadge {
  // 1. 업종코드 마스터에 없음
  if (!row.industry_info) {
    return {
      label: '-',
      tooltip: '업종코드 마스터에 없음',
      className: 'bg-gray-100 text-gray-400',
    }
  }
  // 2. 창감 대상 업종 아님
  if (row.industry_info.startup_eligible !== 'O') {
    return {
      label: 'X',
      tooltip: '창업감면 대상 업종 아님',
      className: 'bg-gray-100 text-gray-500',
    }
  }
  // 3. 권역 × 청년 × 개업연도로 감면율 결정
  const openingYear = row.opening_year ?? reportYear
  const result = calculateStartupReductionRate({
    zone: row.region_zone,
    isYoung: row.is_young,
    openingYear,
  })
  const className =
    result.rate === 100
      ? 'bg-green-100 text-green-800'
      : result.rate === 75
        ? 'bg-emerald-100 text-emerald-700'
        : result.rate === 50
          ? 'bg-yellow-100 text-yellow-800'
          : result.rate === 25
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-500'
  const tooltip = `${result.appliedRule} · ${getRegionZoneName(row.region_zone)}${row.is_young ? ' · 청년' : ''}`
  return { label: result.rateLabel, tooltip, className }
}

interface MidSpecialBadge {
  label: string
  tooltip: string
  className: string
}

function midSpecialBadgeOf(row: ReviewRow): MidSpecialBadge {
  if (!row.industry_info) {
    return {
      label: '-',
      tooltip: '업종코드 마스터에 없음',
      className: 'bg-gray-100 text-gray-400',
    }
  }
  if (row.industry_info.mid_special_eligible !== 'O') {
    return {
      label: 'X',
      tooltip: '중특감면 대상 업종 아님',
      className: 'bg-gray-100 text-gray-500',
    }
  }
  const rate = row.industry_info.small_biz_reduction_rate
  if (rate == null) {
    return {
      label: 'O',
      tooltip: '중특감면 대상 (감면율 미정)',
      className: 'bg-blue-50 text-blue-700',
    }
  }
  const pct = Math.round(rate * 100)
  return {
    label: `${pct}%`,
    tooltip: `중특감면 ${pct}%`,
    className: 'bg-blue-100 text-blue-800',
  }
}

export function PersonalReviewClient({
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
    const groups = new Map<string, ReviewRow[]>()
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
        router.push(`/reports-review/income-tax/personal?${params.toString()}`)
      })
    },
    [year, manager, router],
  )

  const handleSave = useCallback(async () => {
    if (changedRows.length === 0) return
    setSaving(true)
    try {
      const result = await saveReviewNotes({ year, notes: changedRows })
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
      {/* 필터 + 저장 */}
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              startTransition(() =>
                router.push('/reports-review/income-tax/trader'),
              )
            }
            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 text-sm"
            title="매매사업자 결산참고로 이동"
          >
            <ArrowRightLeft size={13} />
            매매사업자 참고
          </button>
          <button
            onClick={handleSave}
            disabled={changedRows.length === 0 || saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-2 text-sm"
          >
            <Save size={14} />
            {saving ? '저장 중...' : `저장${changedRows.length > 0 ? ` (${changedRows.length})` : ''}`}
          </button>
        </div>
      </div>

      {/* 담당자별 섹션 */}
      {groupedByManager.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          표시할 활성 개인사업자가 없습니다.
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
  rows: ReviewRow[]
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
              <th className="px-2 py-2 text-left whitespace-nowrap">종목</th>
              <th className="px-2 py-2 text-center whitespace-nowrap">창감</th>
              <th className="px-2 py-2 text-center whitespace-nowrap">중특</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">매출액</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                영업이익
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                당기순이익
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                종합소득금액
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                산출세액
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                세액공제
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                세액감면
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                결정세액
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                기납부세액
              </th>
              <th className="px-2 py-2 text-right whitespace-nowrap">
                납부할 총세액
              </th>
              <th className="px-2 py-2 text-left min-w-[160px]">메모</th>
              <th className="px-2 py-2 text-center w-14 whitespace-nowrap">
                확인
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ReviewRowItem
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

interface ReviewRowItemProps {
  row: ReviewRow
  year: number
  isExpanded: boolean
  onToggle: (clientId: string) => void
  editable: EditableEntry | undefined
  onEditChange: (clientId: string, patch: Partial<EditableEntry>) => void
}

const ReviewRowItem = memo(function ReviewRowItem({
  row,
  year,
  isExpanded,
  onToggle,
  editable,
  onEditChange,
}: ReviewRowItemProps) {
  const rowMuted = !row.has_report ? 'text-gray-400' : ''
  const startup = startupBadgeOf(row, year)
  const mid = midSpecialBadgeOf(row)
  return (
    <>
      <tr
        className={`border-t border-gray-100 hover:bg-indigo-50/30 cursor-pointer ${rowMuted}`}
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
        <td className="px-2 py-2 whitespace-nowrap">{row.business_item}</td>
        <td
          className="px-2 py-2 text-center whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${startup.className}`}
            title={startup.tooltip}
          >
            {startup.label}
          </span>
        </td>
        <td
          className="px-2 py-2 text-center whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${mid.className}`}
            title={mid.tooltip}
          >
            {mid.label}
          </span>
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.revenue)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.operating_income)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.net_income)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.income_total)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.income_calculated_tax)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.income_tax_credit)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.income_tax_reduction)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums font-medium">
          {fmt(row.income_determined_total)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums">
          {fmt(row.income_prepaid_tax)}
        </td>
        <td className="px-2 py-2 text-right tabular-nums font-medium">
          {fmt(row.income_final_payable)}
        </td>
        <td
          className="px-2 py-2"
          onClick={(e) => e.stopPropagation()}
        >
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
          <td colSpan={17} className="px-4 py-3 border-t border-blue-100">
            <ExpandedDetail row={row} />
          </td>
        </tr>
      )}
    </>
  )
})

function ExpandedDetail({ row }: { row: ReviewRow }) {
  return (
    <div className="space-y-4">
      <ReductionMetaPanel row={row} />
      {row.has_report ? (
        <div className="grid grid-cols-2 gap-6">
          <CreditsTable credits={row.tax_credits} />
          <ReductionsTable reductions={row.tax_reductions} />
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          종합소득세 보고서가 작성되지 않았습니다.
        </div>
      )}
    </div>
  )
}

function ReductionMetaPanel({ row }: { row: ReviewRow }) {
  const info = row.industry_info
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs bg-white border border-gray-200 rounded px-3 py-2">
      <div>
        <span className="text-gray-500">업종코드</span>{' '}
        <span className="font-medium">{row.business_category_code ?? '-'}</span>
        {info?.business_description && (
          <span className="text-gray-500 ml-2">{info.business_description}</span>
        )}
      </div>
      <div>
        <span className="text-gray-500">권역</span>{' '}
        <span className="font-medium">{getRegionZoneName(row.region_zone)}</span>
        <span className="text-gray-400 ml-2">{row.address ?? '주소 없음'}</span>
      </div>
      <div>
        <span className="text-gray-500">창감 가능</span>{' '}
        <span className="font-medium">{info?.startup_eligible ?? '-'}</span>
        {info?.startup_note && (
          <span className="text-gray-400 ml-2">{info.startup_note}</span>
        )}
      </div>
      <div>
        <span className="text-gray-500">중특 가능</span>{' '}
        <span className="font-medium">{info?.mid_special_eligible ?? '-'}</span>
        {info?.small_biz_reduction_rate != null && (
          <span className="text-gray-400 ml-2">
            감면율 {Math.round(info.small_biz_reduction_rate * 100)}%
          </span>
        )}
      </div>
      <div>
        <span className="text-gray-500">청년 여부</span>{' '}
        <span className="font-medium">{row.is_young ? '만 35세 미만 (청년)' : '일반'}</span>
      </div>
      <div>
        <span className="text-gray-500">개업연도</span>{' '}
        <span className="font-medium">{row.opening_year ?? '-'}</span>
      </div>
    </div>
  )
}

function categoryLabel(item: TaxCredit | TaxReduction): string {
  return item.custom_name?.trim() || item.type
}

function CreditsTable({ credits }: { credits: TaxCredit[] }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-800 mb-2">
        세액공제 상세
      </h3>
      {credits.length === 0 ? (
        <p className="text-xs text-gray-500">세액공제 없음</p>
      ) : (
        <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-2 py-1.5 text-left">공제 구분</th>
              <th className="px-2 py-1.5 text-right">당기 공제액</th>
              <th className="px-2 py-1.5 text-right">이월 공제액</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {credits.map((credit, idx) => (
              <tr key={idx} className="border-t border-gray-200">
                <td className="px-2 py-1.5">{categoryLabel(credit)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {credit.current_amount.toLocaleString('ko-KR')}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {credit.carryover_amount.toLocaleString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function ReductionsTable({ reductions }: { reductions: TaxReduction[] }) {
  return (
    <div>
      <h3 className="font-semibold text-sm text-gray-800 mb-2">
        세액감면 상세
      </h3>
      {reductions.length === 0 ? (
        <p className="text-xs text-gray-500">세액감면 없음</p>
      ) : (
        <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-2 py-1.5 text-left">감면 구분</th>
              <th className="px-2 py-1.5 text-right">감면액</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {reductions.map((reduction, idx) => (
              <tr key={idx} className="border-t border-gray-200">
                <td className="px-2 py-1.5">{categoryLabel(reduction)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {reduction.current_amount.toLocaleString('ko-KR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
