'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { Save, Plus, Download, Upload, Printer, RefreshCw } from 'lucide-react'
import type { Client, AdjustmentInvoice } from '@/types/database'
import { calculateInvoiceRow } from '@/lib/calculators/fee-schedule'
import { saveInvoiceBatch } from '@/app/actions/adjustment-invoices'
import { formatCurrency } from '@/lib/utils/format'
import InvoiceRow from './InvoiceRow'
import InvoicePreviewModal from './InvoicePreviewModal'
import ExcelImportModal from './ExcelImportModal'

export type RowState = {
  rowId: string
  dbId: string | null
  businessNumber: string
  clientId: string | null
  clientName: string
  revenue: number
  adjustmentFee: number
  taxCreditAdditional: number
  faithfulReportFee: number
  discount: number
  supplyAmount: number
  vatAmount: number
  totalAmount: number
  paymentMethod: '자동이체' | '직접입금' | '미확인'
  isPaid: boolean
  isDirty: boolean
  isDeleted: boolean
  selected: boolean
}

type Props = {
  initialClients: Client[]
  initialInvoices: AdjustmentInvoice[]
  initialYear: number
  initialBusinessType: 'corporate' | 'individual'
}

export default function AdjustmentInvoiceManager({
  initialClients,
  initialInvoices,
  initialYear,
  initialBusinessType,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [year, setYear] = useState(initialYear)
  const [businessType, setBusinessType] = useState<'corporate' | 'individual'>(initialBusinessType)
  const [managerFilter, setManagerFilter] = useState('all')

  const [rows, setRows] = useState<RowState[]>(() =>
    initialInvoices.map(invoiceToRow)
  )

  const [previewDbId, setPreviewDbId] = useState<string | null>(null)
  const [previewClientName, setPreviewClientName] = useState('')
  const [excelModalOpen, setExcelModalOpen] = useState(false)

  const visibleRows = useMemo(() => rows.filter((r) => !r.isDeleted), [rows])

  const managers = useMemo(
    () => [...new Set(initialClients.map((c) => c.manager).filter((m): m is string => !!m))],
    [initialClients]
  )

  const totals = useMemo(() => {
    const acc = {
      revenue: 0, adjustmentFee: 0,
      taxCreditAdditional: 0, faithfulReportFee: 0, discount: 0,
      supplyAmount: 0, vatAmount: 0, totalAmount: 0,
      paidCount: 0, unpaidCount: 0,
    }
    for (const r of visibleRows) {
      acc.revenue += r.revenue
      acc.adjustmentFee += r.adjustmentFee
      acc.taxCreditAdditional += r.taxCreditAdditional
      acc.faithfulReportFee += r.faithfulReportFee
      acc.discount += r.discount
      acc.supplyAmount += r.supplyAmount
      acc.vatAmount += r.vatAmount
      acc.totalAmount += r.totalAmount
      if (r.isPaid) acc.paidCount++; else acc.unpaidCount++
    }
    return acc
  }, [visibleRows])

  function confirmDirty(): boolean {
    if (rows.some((r) => r.isDirty)) {
      return confirm('저장되지 않은 변경사항이 있습니다. 그래도 이동할까요?')
    }
    return true
  }

  function handleBusinessTypeChange(newType: 'corporate' | 'individual') {
    if (!confirmDirty()) return
    router.push(`/invoices/adjustment?year=${year}&type=${newType}`)
  }

  function handleYearChange(newYear: number) {
    if (!confirmDirty()) return
    setYear(newYear)
    router.push(`/invoices/adjustment?year=${newYear}&type=${businessType}`)
  }

  function updateCell(rowId: string, field: keyof RowState, value: RowState[keyof RowState]) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r
        const next = { ...r, [field]: value, isDirty: true }
        const calc = calculateInvoiceRow({
          revenue: next.revenue,
          businessType,
          taxCreditAdditional: next.taxCreditAdditional,
          faithfulReportFee: next.faithfulReportFee,
          discount: next.discount,
        })
        next.adjustmentFee = calc.adjustmentFee
        next.supplyAmount = calc.supplyAmount
        next.vatAmount = calc.vatAmount
        next.totalAmount = calc.totalAmount
        return next
      })
    )
  }

  function handleLoadClients() {
    const existingBNs = new Set(
      rows.filter((r) => !r.isDeleted && r.businessNumber).map((r) => r.businessNumber)
    )
    const filtered = initialClients.filter((c) => {
      if (managerFilter !== 'all' && c.manager !== managerFilter) return false
      if (!c.business_number) return false
      return !existingBNs.has(c.business_number)
    })
    if (filtered.length === 0) {
      alert('추가할 고객이 없습니다. (이미 모두 추가됐거나 필터 조건에 맞는 고객이 없습니다)')
      return
    }
    const newRows: RowState[] = filtered.map((c) => ({
      rowId: `new-${Date.now()}-${c.id}`,
      dbId: null,
      businessNumber: c.business_number ?? '',
      clientId: c.id,
      clientName: c.company_name,
      revenue: 0, adjustmentFee: 0,
      taxCreditAdditional: 0, faithfulReportFee: 0, discount: 0,
      supplyAmount: 0, vatAmount: 0, totalAmount: 0,
      paymentMethod: '미확인',
      isPaid: false,
      isDirty: true, isDeleted: false, selected: false,
    }))
    setRows((prev) => [...prev, ...newRows])
  }

  function handleAddEmptyRow() {
    setRows((prev) => [
      ...prev,
      {
        rowId: `new-${Date.now()}`,
        dbId: null,
        businessNumber: '',
        clientId: null,
        clientName: '',
        revenue: 0, adjustmentFee: 0,
        taxCreditAdditional: 0, faithfulReportFee: 0, discount: 0,
        supplyAmount: 0, vatAmount: 0, totalAmount: 0,
        paymentMethod: '미확인',
        isPaid: false,
        isDirty: true, isDeleted: false, selected: false,
      },
    ])
  }

  function handleSaveAll() {
    const dirtyRows = rows.filter((r) => r.isDirty && !r.isDeleted)
    const deletedRows = rows.filter((r) => r.isDeleted && r.dbId)

    if (dirtyRows.length === 0 && deletedRows.length === 0) {
      alert('저장할 변경사항이 없습니다.')
      return
    }

    startTransition(async () => {
      try {
        const { refreshedInvoices } = await saveInvoiceBatch({
          year,
          businessType,
          upserts: dirtyRows.map((r) => rowToPayload(r, year, businessType)),
          deleteIds: deletedRows.map((r) => r.dbId!),
        })
        setRows(refreshedInvoices.map(invoiceToRow))
        alert(`저장 완료 — 변경 ${dirtyRows.length}건, 삭제 ${deletedRows.length}건`)
      } catch (err) {
        alert(`저장 실패: ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  function handleDeleteRow(rowId: string) {
    if (!confirm('이 행을 삭제하시겠습니까? (저장 버튼을 눌러야 DB에 반영됩니다)')) return
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, isDeleted: true } : r))
    )
  }

  function handlePrintPreview(rowId: string) {
    const row = rows.find((r) => r.rowId === rowId)
    if (!row) return
    if (!row.dbId) {
      alert('먼저 저장한 후에 인쇄할 수 있습니다.')
      return
    }
    setPreviewDbId(row.dbId)
    setPreviewClientName(row.clientName)
  }

  function handleBatchPrint() {
    const selected = rows.filter((r) => r.selected && !r.isDeleted && r.dbId)
    if (selected.length === 0) {
      alert('출력할 청구서를 선택해주세요.')
      return
    }
    if (selected.some((r) => r.isDirty)) {
      alert('저장되지 않은 행이 있습니다. 먼저 저장해주세요.')
      return
    }
    selected.forEach((r, i) => {
      setTimeout(() => {
        window.open(`/invoices/adjustment/${r.dbId}/print?auto=1`, '_blank')
      }, i * 600)
    })
  }

  function handleExcelDownload() {
    const data = visibleRows.map((r) => ({
      고객사명: r.clientName,
      사업자번호: r.businessNumber,
      매출액: r.revenue,
      세무조정료: r.adjustmentFee,
      세액공제: r.taxCreditAdditional,
      성실신고: r.faithfulReportFee,
      할인: r.discount,
      최종수수료: r.supplyAmount,
      부가세: r.vatAmount,
      최종청구액: r.totalAmount,
      납부방법: r.paymentMethod,
      납부여부: r.isPaid ? '완료' : '미납',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    const sheetName = `${year}년_${businessType === 'corporate' ? '법인' : '개인'}`
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `조정료청구서_${sheetName}.xlsx`)
  }

  const dirtyCount = rows.filter((r) => r.isDirty && !r.isDeleted).length

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">조정료 청구서 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {year}년 · {businessType === 'corporate' ? '법인·의료사업자' : '개인사업자'} ·
            {' '}{visibleRows.length}건
            {dirtyCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">미저장 {dirtyCount}건</span>
            )}
          </p>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2">
        {/* 사업유형 토글 */}
        <div className="inline-flex rounded-md overflow-hidden border border-gray-300">
          {(['corporate', 'individual'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleBusinessTypeChange(t)}
              className={`px-4 py-2 text-sm font-medium ${
                businessType === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${t === 'individual' ? 'border-l border-gray-300' : ''}`}
            >
              {t === 'corporate' ? '법인사업자' : '개인사업자'}
            </button>
          ))}
        </div>

        {/* 연도 */}
        <div className="flex items-center gap-2 ml-2">
          <label className="text-sm text-gray-600">연도</label>
          <select
            value={year}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            {[year + 1, year, year - 1, year - 2, year - 3, year - 4].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        {/* 담당자 */}
        {managers.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <label className="text-sm text-gray-600">담당자</label>
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="all">전체</option>
              {managers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* 우측 버튼 */}
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={handleLoadClients}
            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            <RefreshCw size={14} />
            고객사 불러오기
          </button>
          <button
            onClick={handleAddEmptyRow}
            className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            <Plus size={14} />
            행 추가
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-700 text-white text-sm rounded-md hover:bg-indigo-800 disabled:opacity-50"
          >
            <Save size={14} />
            {isPending ? '저장 중…' : `저장${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
          </button>
          <button
            onClick={() => setExcelModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-2 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600"
          >
            <Upload size={14} />
            엑셀 업로드
          </button>
          <button
            onClick={handleExcelDownload}
            className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700"
          >
            <Download size={14} />
            엑셀 다운로드
          </button>
          <button
            onClick={handleBatchPrint}
            className="inline-flex items-center gap-1 px-3 py-2 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-800"
          >
            <Printer size={14} />
            일괄 출력
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
            <tr>
              <th className="w-10 p-2 text-center">
                <input
                  type="checkbox"
                  checked={visibleRows.length > 0 && visibleRows.every((r) => r.selected)}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) => r.isDeleted ? r : { ...r, selected: e.target.checked })
                    )
                  }
                />
              </th>
              <th className="text-left p-2">고객사명</th>
              <th className="text-right p-2">매출액</th>
              <th className="text-right p-2">세무조정료</th>
              <th className="text-right p-2">세액공제</th>
              <th className="text-right p-2">성실신고</th>
              <th className="text-right p-2">할인</th>
              <th className="text-right p-2 bg-blue-50">최종수수료</th>
              <th className="text-right p-2 bg-blue-50">부가세</th>
              <th className="text-right p-2 bg-blue-50 font-semibold">최종청구액</th>
              <th className="text-center p-2">납부방법</th>
              <th className="text-center p-2">납부</th>
              <th className="text-center p-2 w-20">작업</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <InvoiceRow
                key={row.rowId}
                row={row}
                onChangeCell={updateCell}
                onPrint={handlePrintPreview}
                onDelete={handleDeleteRow}
              />
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-12 text-gray-400 text-sm">
                  데이터가 없습니다.{' '}
                  <button onClick={handleLoadClients} className="text-indigo-600 underline">
                    고객사 불러오기
                  </button>{' '}
                  또는{' '}
                  <button onClick={handleAddEmptyRow} className="text-indigo-600 underline">
                    행 추가
                  </button>
                  를 사용하세요.
                </td>
              </tr>
            )}
          </tbody>
          {visibleRows.length > 0 && (
            <tfoot className="bg-gray-100 border-t-2 border-gray-300 font-medium text-sm">
              <tr>
                <td colSpan={2} className="p-2 text-right text-gray-600">합 계</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.revenue)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.adjustmentFee)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.taxCreditAdditional)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.faithfulReportFee)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.discount)}</td>
                <td className="p-2 text-right tabular-nums bg-blue-50">{formatCurrency(totals.supplyAmount)}</td>
                <td className="p-2 text-right tabular-nums bg-blue-50">{formatCurrency(totals.vatAmount)}</td>
                <td className="p-2 text-right tabular-nums bg-blue-50 font-bold">{formatCurrency(totals.totalAmount)}</td>
                <td colSpan={2} className="p-2 text-center text-xs text-gray-600">
                  완료 {totals.paidCount} / 미납 {totals.unpaidCount}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {previewDbId && (
        <InvoicePreviewModal
          dbId={previewDbId}
          clientName={previewClientName}
          onClose={() => setPreviewDbId(null)}
        />
      )}

      {excelModalOpen && (
        <ExcelImportModal
          year={year}
          businessType={businessType}
          existingClients={initialClients}
          onClose={() => setExcelModalOpen(false)}
          onImported={(newRows) => {
            setRows((prev) => [...prev, ...newRows])
            setExcelModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function invoiceToRow(inv: AdjustmentInvoice): RowState {
  return {
    rowId: inv.id,
    dbId: inv.id,
    businessNumber: inv.business_number ?? '',
    clientId: inv.client_id,
    clientName: inv.client_name,
    revenue: inv.revenue ?? 0,
    adjustmentFee: inv.adjustment_fee ?? 0,
    taxCreditAdditional: inv.tax_credit_additional ?? 0,
    faithfulReportFee: inv.faithful_report_fee ?? 0,
    discount: inv.discount ?? 0,
    supplyAmount: inv.supply_amount ?? 0,
    vatAmount: inv.vat_amount ?? 0,
    totalAmount: inv.total_amount ?? 0,
    paymentMethod: inv.payment_method ?? '미확인',
    isPaid: inv.is_paid ?? false,
    isDirty: false,
    isDeleted: false,
    selected: false,
  }
}

function rowToPayload(
  row: RowState,
  year: number,
  businessType: 'corporate' | 'individual'
) {
  return {
    id: row.dbId,
    client_id: row.clientId,
    business_type: businessType,
    client_name: row.clientName,
    business_number: row.businessNumber || null,
    revenue: row.revenue,
    settlement_fee: 0,
    adjustment_fee: row.adjustmentFee,
    tax_credit_additional: row.taxCreditAdditional,
    faithful_report_fee: row.faithfulReportFee,
    discount: row.discount,
    supply_amount: row.supplyAmount,
    vat_amount: row.vatAmount,
    total_amount: row.totalAmount,
    final_fee: row.totalAmount,
    year,
    payment_method: row.paymentMethod,
    is_paid: row.isPaid,
  }
}
