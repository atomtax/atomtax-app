'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { Save, Plus, Download, Upload, Printer, RefreshCw, Trash2, Search } from 'lucide-react'
import type { Client, AdjustmentInvoice } from '@/types/database'
import {
  calculateInvoiceRow,
  isMaemaeBusinessCode,
} from '@/lib/calculators/fee-schedule'
import { saveInvoiceBatch } from '@/app/actions/adjustment-invoices'
import { downloadInvoice, downloadInvoicesBatch } from '@/lib/utils/invoice-export'
import { formatCurrency } from '@/lib/utils/format'
import InvoiceRow from './InvoiceRow'
import InvoicePreviewModal from './InvoicePreviewModal'
import ExcelImportModal from './ExcelImportModal'
import BatchExportModal from './BatchExportModal'

export type RowState = {
  rowId: string
  dbId: string | null
  businessNumber: string
  clientId: string | null
  clientName: string
  manager: string | null
  businessCategoryCode: string | null
  revenue: number
  settlementFee: number
  adjustmentFee: number
  taxCreditAdditional: number
  faithfulReportFee: number
  discount: number
  maemaeDiscount: number
  isMaemaeDiscountManual: boolean
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

  const [pendingYear, setPendingYear] = useState(initialYear)
  const [pendingBusinessType, setPendingBusinessType] = useState<'corporate' | 'individual'>(initialBusinessType)
  const [pendingManagerFilter, setPendingManagerFilter] = useState('all')
  const [appliedManagerFilter, setAppliedManagerFilter] = useState('all')

  const managerMap = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const c of initialClients) m.set(c.id, c.manager ?? null)
    return m
  }, [initialClients])

  const categoryMap = useMemo(() => {
    const m = new Map<string, string | null>()
    for (const c of initialClients) m.set(c.id, c.business_category_code ?? null)
    return m
  }, [initialClients])

  const [rows, setRows] = useState<RowState[]>(() =>
    initialInvoices.map((inv) => invoiceToRow(inv, managerMap, categoryMap)),
  )

  const [previewRowId, setPreviewRowId] = useState<string | null>(null)
  const [excelModalOpen, setExcelModalOpen] = useState(false)
  const [batchExportModalOpen, setBatchExportModalOpen] = useState(false)
  const [batchExporting, setBatchExporting] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | undefined>()

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      if (r.isDeleted) return false
      if (appliedManagerFilter !== 'all') {
        const client = initialClients.find((c) => c.id === r.clientId)
        if (!client || client.manager !== appliedManagerFilter) return false
      }
      return true
    })
  }, [rows, appliedManagerFilter, initialClients])

  const managers = useMemo(
    () => [...new Set(initialClients.map((c) => c.manager).filter((m): m is string => !!m))],
    [initialClients]
  )

  const totals = useMemo(() => {
    const acc = {
      revenue: 0, settlementFee: 0, adjustmentFee: 0,
      taxCreditAdditional: 0, faithfulReportFee: 0, discount: 0,
      maemaeDiscount: 0,
      supplyAmount: 0, vatAmount: 0, totalAmount: 0,
      paidCount: 0, unpaidCount: 0,
    }
    for (const r of visibleRows) {
      acc.revenue += r.revenue
      acc.settlementFee += r.settlementFee
      acc.adjustmentFee += r.adjustmentFee
      acc.taxCreditAdditional += r.taxCreditAdditional
      acc.faithfulReportFee += r.faithfulReportFee
      acc.discount += r.discount
      acc.maemaeDiscount += r.maemaeDiscount
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

  function handleSearch() {
    const yearChanged = pendingYear !== initialYear
    const typeChanged = pendingBusinessType !== initialBusinessType
    if (yearChanged || typeChanged) {
      if (!confirmDirty()) return
    }
    setAppliedManagerFilter(pendingManagerFilter)
    if (yearChanged || typeChanged) {
      router.push(`/invoices/adjustment?year=${pendingYear}&type=${pendingBusinessType}`)
    }
  }

  function updateCell(rowId: string, field: keyof RowState, value: RowState[keyof RowState]) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r
        const next = { ...r, [field]: value, isDirty: field !== 'selected' ? true : r.isDirty }
        // 사용자가 매매업 할인을 직접 수정하면 수동 모드 ON
        if (field === 'maemaeDiscount') {
          next.isMaemaeDiscountManual = true
        }
        const calc = calculateInvoiceRow({
          revenue: next.revenue,
          businessType: initialBusinessType,
          taxCreditAdditional: next.taxCreditAdditional,
          faithfulReportFee: next.faithfulReportFee,
          discount: next.discount,
          isMaemaeClient: isMaemaeBusinessCode(next.businessCategoryCode),
          isMaemaeDiscountManual: next.isMaemaeDiscountManual,
          currentMaemaeDiscount: next.maemaeDiscount,
        })
        next.settlementFee = calc.settlementFee
        next.adjustmentFee = calc.adjustmentFee
        next.maemaeDiscount = calc.maemaeDiscount
        next.supplyAmount = calc.supplyAmount
        next.vatAmount = calc.vatAmount
        next.totalAmount = calc.totalAmount
        return next
      })
    )
  }

  function resetMaemaeDiscount(rowId: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r
        const next = { ...r, isMaemaeDiscountManual: false, isDirty: true }
        const calc = calculateInvoiceRow({
          revenue: next.revenue,
          businessType: initialBusinessType,
          taxCreditAdditional: next.taxCreditAdditional,
          faithfulReportFee: next.faithfulReportFee,
          discount: next.discount,
          isMaemaeClient: isMaemaeBusinessCode(next.businessCategoryCode),
          isMaemaeDiscountManual: false,
          currentMaemaeDiscount: 0,
        })
        next.maemaeDiscount = calc.maemaeDiscount
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
      if (appliedManagerFilter !== 'all' && c.manager !== appliedManagerFilter) return false
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
      manager: c.manager ?? null,
      businessCategoryCode: c.business_category_code ?? null,
      revenue: 0, settlementFee: 0, adjustmentFee: 0,
      taxCreditAdditional: 0, faithfulReportFee: 0, discount: 0,
      maemaeDiscount: 0, isMaemaeDiscountManual: false,
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
        manager: null,
        businessCategoryCode: null,
        revenue: 0, settlementFee: 0, adjustmentFee: 0,
        taxCreditAdditional: 0, faithfulReportFee: 0, discount: 0,
        maemaeDiscount: 0, isMaemaeDiscountManual: false,
        supplyAmount: 0, vatAmount: 0, totalAmount: 0,
        paymentMethod: '미확인',
        isPaid: false,
        isDirty: true, isDeleted: false, selected: false,
      },
    ])
  }

  function recomputeAllMaemaeRows(rows: RowState[]): RowState[] {
    let anyChanged = false
    const next = rows.map((r) => {
      if (r.isDeleted) return r
      if (!isMaemaeBusinessCode(r.businessCategoryCode)) return r
      // 수동 모드는 건너뜀 (사용자 의도 보존)
      if (r.isMaemaeDiscountManual) return r
      const calc = calculateInvoiceRow({
        revenue: r.revenue,
        businessType: initialBusinessType,
        taxCreditAdditional: r.taxCreditAdditional,
        faithfulReportFee: r.faithfulReportFee,
        discount: r.discount,
        isMaemaeClient: true,
        isMaemaeDiscountManual: false,
        currentMaemaeDiscount: 0,
      })
      if (
        calc.maemaeDiscount === r.maemaeDiscount &&
        calc.supplyAmount === r.supplyAmount &&
        calc.vatAmount === r.vatAmount &&
        calc.totalAmount === r.totalAmount
      ) {
        return r
      }
      anyChanged = true
      return {
        ...r,
        settlementFee: calc.settlementFee,
        adjustmentFee: calc.adjustmentFee,
        maemaeDiscount: calc.maemaeDiscount,
        supplyAmount: calc.supplyAmount,
        vatAmount: calc.vatAmount,
        totalAmount: calc.totalAmount,
        isDirty: true,
      }
    })
    return anyChanged ? next : rows
  }

  // 페이지 로드 후 한 번 — 매매업 고객 행을 자동 재계산
  useEffect(() => {
    setRows((prev) => recomputeAllMaemaeRows(prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSaveAll() {
    // 저장 직전 일괄 재계산
    const recomputed = recomputeAllMaemaeRows(rows)
    if (recomputed !== rows) {
      setRows(recomputed)
    }
    const dirtyRows = recomputed.filter((r) => r.isDirty && !r.isDeleted)
    const deletedRows = recomputed.filter((r) => r.isDeleted && r.dbId)

    if (dirtyRows.length === 0 && deletedRows.length === 0) {
      alert('저장할 변경사항이 없습니다.')
      return
    }

    startTransition(async () => {
      try {
        const { refreshedInvoices } = await saveInvoiceBatch({
          year: initialYear,
          businessType: initialBusinessType,
          upserts: dirtyRows.map((r) => rowToPayload(r, initialYear, initialBusinessType)),
          deleteIds: deletedRows.map((r) => r.dbId!),
        })
        setRows(refreshedInvoices.map((inv) => invoiceToRow(inv, managerMap, categoryMap)))
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

  function handleBatchDelete() {
    const selectedRows = rows.filter((r) => r.selected && !r.isDeleted)
    if (selectedRows.length === 0) {
      alert('삭제할 청구서를 선택해주세요.')
      return
    }
    const ok = confirm(
      `선택한 ${selectedRows.length}건의 청구서를 정말 삭제하시겠습니까?\n(저장 버튼을 눌러야 DB에 반영됩니다)`
    )
    if (!ok) return
    const selectedRowIds = new Set(selectedRows.map((r) => r.rowId))
    setRows((prev) =>
      prev.map((r) => (selectedRowIds.has(r.rowId) ? { ...r, isDeleted: true } : r))
    )
  }

  function handlePrintPreview(rowId: string) {
    const row = rows.find((r) => r.rowId === rowId)
    if (!row) return
    if (!row.dbId) {
      alert('먼저 저장한 후에 인쇄할 수 있습니다.')
      return
    }
    setPreviewRowId(rowId)
  }

  async function handleDownloadSinglePDF(rowId: string) {
    const row = rows.find((r) => r.rowId === rowId)
    if (!row || !row.dbId) {
      alert('먼저 저장한 후에 다운로드할 수 있습니다.')
      return
    }
    try {
      await downloadInvoice(row.dbId, `조정료청구서_${row.clientName}_${initialYear}`, 'pdf')
    } catch (err) {
      alert(`PDF 다운로드 실패: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  async function handleDownloadSinglePNG(rowId: string) {
    const row = rows.find((r) => r.rowId === rowId)
    if (!row || !row.dbId) {
      alert('먼저 저장한 후에 다운로드할 수 있습니다.')
      return
    }
    try {
      await downloadInvoice(row.dbId, `조정료청구서_${row.clientName}_${initialYear}`, 'png')
    } catch (err) {
      alert(`PNG 다운로드 실패: ${err instanceof Error ? err.message : String(err)}`)
    }
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
    setBatchExportModalOpen(true)
  }

  async function handleBatchExport(format: 'pdf' | 'png') {
    const selected = rows.filter((r) => r.selected && !r.isDeleted && r.dbId)
    setBatchExporting(true)
    setBatchProgress({ current: 0, total: selected.length })
    try {
      const result = await downloadInvoicesBatch(
        selected.map((r) => ({
          id: r.dbId!,
          filename: `조정료청구서_${r.clientName}_${initialYear}`,
        })),
        format,
        (current, total) => setBatchProgress({ current, total })
      )
      setBatchExporting(false)
      setBatchExportModalOpen(false)
      setBatchProgress(undefined)
      if (result.failedItems.length > 0) {
        alert(
          `일괄 출력 완료: 성공 ${result.successCount}건, 실패 ${result.failedItems.length}건\n` +
            result.failedItems.map((f) => `- ${f.error}`).join('\n')
        )
      } else {
        alert(`일괄 출력 완료: 총 ${result.successCount}건 다운로드`)
      }
    } catch (err) {
      setBatchExporting(false)
      alert(`일괄 출력 실패: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  function handleExcelDownload() {
    const data = visibleRows.map((r) => ({
      고객사명: r.clientName,
      사업자번호: r.businessNumber,
      매출액: r.revenue,
      결산보수: r.settlementFee,
      세무조정료: r.adjustmentFee,
      세액공제: r.taxCreditAdditional,
      성실신고: r.faithfulReportFee,
      할인: r.discount,
      매매업할인: r.maemaeDiscount,
      최종수수료: r.supplyAmount,
      부가세: r.vatAmount,
      최종청구액: r.totalAmount,
      납부방법: r.paymentMethod,
      납부여부: r.isPaid ? '완료' : '미납',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    const sheetName = `${initialYear}년_${initialBusinessType === 'corporate' ? '법인' : '개인'}`
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `조정료청구서_${sheetName}.xlsx`)
  }

  const dirtyCount = rows.filter((r) => r.isDirty && !r.isDeleted).length
  const previewRow = previewRowId ? rows.find((r) => r.rowId === previewRowId) ?? null : null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-8 p-8 max-w-[1600px] mx-auto overflow-hidden">
      {/* 상단 영역 — 자연 흐름. 스크롤은 아래 테이블 컨테이너에서만 발생 */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">조정료 청구서 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {initialYear}년 · {initialBusinessType === 'corporate' ? '법인·의료사업자' : '개인사업자'} ·
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
              onClick={() => setPendingBusinessType(t)}
              className={`px-4 py-2 text-sm font-medium ${
                pendingBusinessType === t
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
            value={pendingYear}
            onChange={(e) => setPendingYear(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            {[pendingYear + 1, pendingYear, pendingYear - 1, pendingYear - 2, pendingYear - 3, pendingYear - 4].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        {/* 담당자 */}
        {managers.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <label className="text-sm text-gray-600">담당자</label>
            <select
              value={pendingManagerFilter}
              onChange={(e) => setPendingManagerFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="all">전체</option>
              {managers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* 조회 버튼 */}
        <div className="flex items-center gap-2 ml-1">
          <button
            onClick={handleSearch}
            className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            <Search size={14} />
            조회
          </button>
          {(pendingYear !== initialYear || pendingBusinessType !== initialBusinessType || pendingManagerFilter !== appliedManagerFilter) && (
            <span className="text-xs text-amber-600">조회 버튼을 눌러 적용하세요</span>
          )}
        </div>

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
            onClick={handleBatchDelete}
            className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            <Trash2 size={14} />
            선택 삭제
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
      </div>

      {/* 테이블 — 내부 스크롤 컨테이너. thead 가 이 컨테이너 기준 sticky top-0 */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-600 sticky top-0 z-20 shadow-sm">
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
              <th className="text-center p-2 w-20">담당자</th>
              <th className="text-center p-2">고객사명</th>
              <th className="text-center p-2">매출액</th>
              <th className="text-center p-2">결산보수</th>
              <th className="text-center p-2">세무조정료</th>
              <th className="text-center p-2">세액공제</th>
              <th className="text-center p-2">성실신고</th>
              <th className="text-center p-2">할인</th>
              <th className="text-center p-2" title="매매업(703011/703012) 고객: (결산보수+세무조정료) × 30%">매매업 할인</th>
              <th className="text-center p-2 bg-blue-50">최종수수료</th>
              <th className="text-center p-2 bg-blue-50">부가세</th>
              <th className="text-center p-2 bg-blue-50 font-semibold">최종청구액</th>
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
                onResetMaemaeDiscount={resetMaemaeDiscount}
              />
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={16} className="text-center py-12 text-gray-400 text-sm">
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
                <td colSpan={3} className="p-2 text-right text-gray-600">합 계</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.revenue)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.settlementFee)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.adjustmentFee)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.taxCreditAdditional)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.faithfulReportFee)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.discount)}</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(totals.maemaeDiscount)}</td>
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

      {previewRow && (
        <InvoicePreviewModal
          row={previewRow}
          year={initialYear}
          onClose={() => setPreviewRowId(null)}
          onDownloadPDF={handleDownloadSinglePDF}
          onDownloadPNG={handleDownloadSinglePNG}
        />
      )}

      {batchExportModalOpen && (
        <BatchExportModal
          selectedCount={rows.filter((r) => r.selected && !r.isDeleted).length}
          onClose={() => setBatchExportModalOpen(false)}
          onSelect={handleBatchExport}
          isExporting={batchExporting}
          progress={batchProgress}
        />
      )}

      {excelModalOpen && (
        <ExcelImportModal
          year={initialYear}
          businessType={initialBusinessType}
          existingClients={initialClients}
          onClose={() => setExcelModalOpen(false)}
          onImported={(newRows) => {
            setRows((prev) => {
              const newRowsByBN = new Map<string, RowState>()
              for (const r of newRows) {
                if (r.businessNumber) newRowsByBN.set(r.businessNumber, r)
              }
              const updated = prev.map((r) => {
                if (!r.isDeleted && r.businessNumber && newRowsByBN.has(r.businessNumber)) {
                  const nr = newRowsByBN.get(r.businessNumber)!
                  newRowsByBN.delete(r.businessNumber)
                  return {
                    ...r,
                    revenue: nr.revenue,
                    settlementFee: nr.settlementFee,
                    adjustmentFee: nr.adjustmentFee,
                    taxCreditAdditional: nr.taxCreditAdditional,
                    faithfulReportFee: nr.faithfulReportFee,
                    discount: nr.discount,
                    supplyAmount: nr.supplyAmount,
                    vatAmount: nr.vatAmount,
                    totalAmount: nr.totalAmount,
                    paymentMethod: nr.paymentMethod,
                    isPaid: nr.isPaid,
                    clientName: nr.clientName || r.clientName,
                    isDirty: true,
                  }
                }
                return r
              })
              return [...updated, ...Array.from(newRowsByBN.values())]
            })
            setExcelModalOpen(false)
            alert(`엑셀 업로드 완료: ${newRows.length}건 처리됨`)
          }}
        />
      )}
    </div>
  )
}

function invoiceToRow(
  inv: AdjustmentInvoice,
  managerMap?: Map<string, string | null>,
  categoryMap?: Map<string, string | null>,
): RowState {
  // client 연결된 행은 clients.manager 우선, 수동 행은 DB 의 manager 컬럼 사용
  const linkedManager = inv.client_id ? managerMap?.get(inv.client_id) ?? null : null
  return {
    rowId: inv.id,
    dbId: inv.id,
    businessNumber: inv.business_number ?? '',
    clientId: inv.client_id,
    clientName: inv.client_name,
    manager: inv.client_id ? linkedManager : inv.manager ?? null,
    businessCategoryCode: inv.client_id ? categoryMap?.get(inv.client_id) ?? null : null,
    revenue: inv.revenue ?? 0,
    settlementFee: inv.settlement_fee ?? 0,
    adjustmentFee: inv.adjustment_fee ?? 0,
    taxCreditAdditional: inv.tax_credit_additional ?? 0,
    faithfulReportFee: inv.faithful_report_fee ?? 0,
    discount: inv.discount ?? 0,
    maemaeDiscount: inv.maemae_discount ?? 0,
    isMaemaeDiscountManual: inv.is_maemae_discount_manual ?? false,
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
    // 수동 행만 manager 저장; 자동 연결 행은 null (clients.manager 사용)
    manager: row.clientId ? null : row.manager,
    revenue: row.revenue,
    settlement_fee: row.settlementFee,
    adjustment_fee: row.adjustmentFee,
    tax_credit_additional: row.taxCreditAdditional,
    faithful_report_fee: row.faithfulReportFee,
    discount: row.discount,
    maemae_discount: row.maemaeDiscount,
    is_maemae_discount_manual: row.isMaemaeDiscountManual,
    supply_amount: row.supplyAmount,
    vat_amount: row.vatAmount,
    total_amount: row.totalAmount,
    final_fee: row.totalAmount,
    year,
    payment_method: row.paymentMethod,
    is_paid: row.isPaid,
  }
}
