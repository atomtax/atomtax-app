'use client'

import { useState, useTransition, useCallback } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import type { TraderInventoryWithClient, ProgressStatus } from '@/types/database'
import { PROGRESS_STATUS_OPTIONS } from '@/types/database'
import type { TraderClient } from '@/lib/db/traders'
import type { InventoryRowSave } from '@/app/actions/traders'
import { saveInventoryBatchAction } from '@/app/actions/traders'
import { formatAmount, daysUntil, formatHoldingPeriod } from '@/lib/utils/format'

interface RowState extends TraderInventoryWithClient {
  isDirty: boolean
  isDeleted: boolean
  selected: boolean
}

function toRowState(item: TraderInventoryWithClient): RowState {
  return { ...item, isDirty: false, isDeleted: false, selected: false }
}

function newBlankRow(): RowState {
  const blank: TraderInventoryWithClient = {
    id: '',
    client_id: null,
    property_address: null,
    property_type: null,
    acquisition_date: null,
    acquisition_price: null,
    transfer_date: null,
    transfer_price: null,
    filing_deadline: null,
    progress_status: '미확인',
    is_taxable: false,
    output_vat: null,
    notes: null,
    created_at: '',
    updated_at: '',
    client: null,
  }
  return { ...blank, isDirty: true, isDeleted: false, selected: false }
}

const PROGRESS_COLORS: Record<ProgressStatus, string> = {
  '미확인': 'bg-gray-100 text-gray-600',
  '진행중': 'bg-amber-100 text-amber-700',
  '완료': 'bg-green-100 text-green-700',
}

const COLUMN_HEADERS = [
  '', // checkbox
  '고객명',
  '물건주소',
  '종류',
  '취득일',
  '취득가액',
  '양도일',
  '양도가액',
  '보유기간',
  '신고기한',
  'D-day',
  '진행상태',
  '과세여부',
  '부가세',
  '비고',
  '', // delete
]

type Props = {
  initialData: TraderInventoryWithClient[]
  clients: TraderClient[]
}

export default function InventorySheet({ initialData, clients }: Props) {
  const [rows, setRows] = useState<RowState[]>(() => initialData.map(toRowState))
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const updateCell = useCallback(
    <K extends keyof RowState>(idx: number, field: K, value: RowState[K]) => {
      setRows((prev) =>
        prev.map((r, i) =>
          i === idx
            ? { ...r, [field]: value, isDirty: field !== 'selected' ? true : r.isDirty }
            : r
        )
      )
    },
    []
  )

  const addRow = () => setRows((prev) => [...prev, newBlankRow()])

  const markDelete = (idx: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, isDeleted: !r.isDeleted, isDirty: true } : r))
    )
  }

  const handleSave = () => {
    setSaveError('')
    setSaveMsg('')
    const dirty = rows.filter((r) => r.isDirty && !r.isDeleted)
    const deleteIds = rows.filter((r) => r.isDeleted && r.id).map((r) => r.id)

    if (dirty.length === 0 && deleteIds.length === 0) {
      setSaveMsg('변경 사항이 없습니다.')
      return
    }

    const toSave: InventoryRowSave[] = dirty.map((r) => ({
      id: r.id || undefined,
      client_id: r.client_id,
      property_address: r.property_address,
      property_type: r.property_type,
      acquisition_date: r.acquisition_date,
      acquisition_price: r.acquisition_price,
      transfer_date: r.transfer_date,
      transfer_price: r.transfer_price,
      filing_deadline: r.filing_deadline,
      progress_status: r.progress_status,
      is_taxable: r.is_taxable,
      output_vat: r.output_vat,
      notes: r.notes,
    }))

    startTransition(async () => {
      try {
        const { refreshedData } = await saveInventoryBatchAction(toSave, deleteIds)
        setRows(refreshedData.map(toRowState))
        setSaveMsg(`저장 완료 (${dirty.length}건 저장, ${deleteIds.length}건 삭제)`)
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : '저장 실패')
      }
    })
  }

  const dirtyCount = rows.filter((r) => r.isDirty && !r.isDeleted).length
  const deleteCount = rows.filter((r) => r.isDeleted).length

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus size={15} />
            행 추가
          </button>
          {(dirtyCount > 0 || deleteCount > 0) && (
            <span className="text-xs text-amber-600">
              {dirtyCount > 0 && `${dirtyCount}건 수정됨`}
              {dirtyCount > 0 && deleteCount > 0 && ' · '}
              {deleteCount > 0 && `${deleteCount}건 삭제 예정`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && <span className="text-xs text-green-600">{saveMsg}</span>}
          {saveError && <span className="text-xs text-red-600">{saveError}</span>}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
          >
            <Save size={15} />
            {isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {/* Sheet */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="text-xs w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
              {COLUMN_HEADERS.map((h, i) => (
                <th
                  key={i}
                  className="border-b border-gray-200 px-2 py-2 text-left font-medium whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMN_HEADERS.length} className="py-10 text-center text-gray-400">
                  데이터가 없습니다. 행 추가 버튼으로 새 물건을 입력하세요.
                </td>
              </tr>
            )}
            {rows.map((row, idx) => {
              const days = daysUntil(row.filing_deadline)
              const daysText =
                days == null
                  ? ''
                  : days === 0
                  ? 'D-0'
                  : days > 0
                  ? `D-${days}`
                  : `D+${Math.abs(days)}`
              const daysColor =
                days == null
                  ? ''
                  : days < 0
                  ? 'text-red-600 font-semibold'
                  : days <= 7
                  ? 'text-orange-500 font-semibold'
                  : 'text-gray-600'

              return (
                <tr
                  key={idx}
                  className={
                    row.isDeleted
                      ? 'bg-red-50 line-through text-gray-400'
                      : row.isDirty
                      ? 'bg-yellow-50'
                      : 'hover:bg-gray-50'
                  }
                >
                  {/* checkbox */}
                  <td className="border-b border-gray-100 px-2 py-1 w-8">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(e) => updateCell(idx, 'selected', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>

                  {/* 고객명 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[120px]">
                    <select
                      value={row.client_id ?? ''}
                      onChange={(e) => {
                        const cid = e.target.value || null
                        const found = clients.find((c) => c.id === cid) ?? null
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  client_id: cid,
                                  client: found
                                    ? {
                                        id: found.id,
                                        company_name: found.company_name,
                                        representative: found.representative,
                                        business_number: found.business_number,
                                        business_category_code: found.business_category_code,
                                      }
                                    : null,
                                  isDirty: true,
                                }
                              : r
                          )
                        )
                      }}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs"
                    >
                      <option value="">— 선택 —</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* 물건주소 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[180px]">
                    <input
                      type="text"
                      value={row.property_address ?? ''}
                      onChange={(e) => updateCell(idx, 'property_address', e.target.value || null)}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs"
                      placeholder="주소 입력"
                    />
                  </td>

                  {/* 종류 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[80px]">
                    <input
                      type="text"
                      value={row.property_type ?? ''}
                      onChange={(e) => updateCell(idx, 'property_type', e.target.value || null)}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs"
                      placeholder="아파트 등"
                    />
                  </td>

                  {/* 취득일 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[110px]">
                    <input
                      type="date"
                      value={row.acquisition_date ?? ''}
                      onChange={(e) => updateCell(idx, 'acquisition_date', e.target.value || null)}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs"
                    />
                  </td>

                  {/* 취득가액 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[100px]">
                    <input
                      type="text"
                      value={row.acquisition_price != null ? formatAmount(row.acquisition_price) : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value.replace(/,/g, ''), 10)
                        updateCell(idx, 'acquisition_price', isNaN(n) ? null : n)
                      }}
                      onFocus={(e) => {
                        const raw = row.acquisition_price
                        if (raw != null) e.target.value = String(raw)
                      }}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value.replace(/,/g, ''), 10)
                        updateCell(idx, 'acquisition_price', isNaN(n) ? null : n)
                      }}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs text-right"
                      placeholder="0"
                    />
                  </td>

                  {/* 양도일 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[110px]">
                    <input
                      type="date"
                      value={row.transfer_date ?? ''}
                      onChange={(e) => updateCell(idx, 'transfer_date', e.target.value || null)}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs"
                    />
                  </td>

                  {/* 양도가액 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[100px]">
                    <input
                      type="text"
                      value={row.transfer_price != null ? formatAmount(row.transfer_price) : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value.replace(/,/g, ''), 10)
                        updateCell(idx, 'transfer_price', isNaN(n) ? null : n)
                      }}
                      onFocus={(e) => {
                        const raw = row.transfer_price
                        if (raw != null) e.target.value = String(raw)
                      }}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value.replace(/,/g, ''), 10)
                        updateCell(idx, 'transfer_price', isNaN(n) ? null : n)
                      }}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs text-right"
                      placeholder="0"
                    />
                  </td>

                  {/* 보유기간 */}
                  <td className="border-b border-gray-100 px-2 py-1 whitespace-nowrap text-gray-500 min-w-[80px]">
                    {formatHoldingPeriod(row.acquisition_date, row.transfer_date)}
                  </td>

                  {/* 신고기한 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[110px]">
                    <input
                      type="date"
                      value={row.filing_deadline ?? ''}
                      onChange={(e) => updateCell(idx, 'filing_deadline', e.target.value || null)}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs"
                    />
                  </td>

                  {/* D-day */}
                  <td className={`border-b border-gray-100 px-2 py-1 whitespace-nowrap min-w-[60px] ${daysColor}`}>
                    {daysText}
                  </td>

                  {/* 진행상태 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[80px]">
                    <select
                      value={row.progress_status}
                      onChange={(e) => updateCell(idx, 'progress_status', e.target.value as ProgressStatus)}
                      className={`w-full rounded px-1 py-0.5 text-xs border border-transparent focus:border-indigo-400 ${PROGRESS_COLORS[row.progress_status]}`}
                    >
                      {PROGRESS_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* 과세여부 */}
                  <td className="border-b border-gray-100 px-2 py-1 text-center min-w-[60px]">
                    <input
                      type="checkbox"
                      checked={row.is_taxable}
                      onChange={(e) => updateCell(idx, 'is_taxable', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>

                  {/* 부가세 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[90px]">
                    <input
                      type="text"
                      value={row.output_vat != null ? formatAmount(row.output_vat) : ''}
                      onChange={(e) => {
                        const n = parseInt(e.target.value.replace(/,/g, ''), 10)
                        updateCell(idx, 'output_vat', isNaN(n) ? null : n)
                      }}
                      onFocus={(e) => {
                        const raw = row.output_vat
                        if (raw != null) e.target.value = String(raw)
                      }}
                      onBlur={(e) => {
                        const n = parseInt(e.target.value.replace(/,/g, ''), 10)
                        updateCell(idx, 'output_vat', isNaN(n) ? null : n)
                      }}
                      disabled={!row.is_taxable}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs text-right disabled:opacity-40"
                      placeholder="0"
                    />
                  </td>

                  {/* 비고 */}
                  <td className="border-b border-gray-100 px-1 py-1 min-w-[120px]">
                    <input
                      type="text"
                      value={row.notes ?? ''}
                      onChange={(e) => updateCell(idx, 'notes', e.target.value || null)}
                      className="w-full bg-transparent border border-transparent focus:border-indigo-400 focus:bg-white rounded px-1 py-0.5 text-xs"
                    />
                  </td>

                  {/* delete */}
                  <td className="border-b border-gray-100 px-2 py-1 w-8">
                    <button
                      onClick={() => markDelete(idx)}
                      title={row.isDeleted ? '삭제 취소' : '삭제'}
                      className={`${row.isDeleted ? 'text-gray-400' : 'text-red-400 hover:text-red-600'}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
