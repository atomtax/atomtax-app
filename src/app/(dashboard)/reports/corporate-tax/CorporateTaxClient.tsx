'use client'

import { useState, useTransition, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import { Plus, Printer, Trash2, Pencil } from 'lucide-react'
import type { Client, CorporateTaxReport, CorporateTaxReportInsert } from '@/types/database'
import { calculateCorporateTax, calculateLocalTax } from '@/lib/utils/fee-calculator'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/format'
import { upsertCorporateTaxReportAction, deleteCorporateTaxReportAction } from './actions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Toast, { type ToastType } from '@/components/ui/Toast'

interface Props {
  clients: Client[]
  initialReports: CorporateTaxReport[]
}

interface FormState {
  client_id: string
  year: number
  revenue: number | null
  net_profit: number | null
  tax_payment: number | null
  tax_refund: number | null
  prepaid_tax: number | null
  current_loss: number | null
  carryforward_loss: number | null
  has_tax_credit: boolean
  tax_credit_type: string
  tax_credit_increase: number | null
  tax_credit_carryforward: number | null
  tax_credit_note: string
  requires_faithful_report: boolean
  faithful_report_note: string
  additional_notes: string
  rural_tax: number | null
}

const defaultForm = (): FormState => ({
  client_id: '',
  year: new Date().getFullYear() - 1,
  revenue: null,
  net_profit: null,
  tax_payment: null,
  tax_refund: null,
  prepaid_tax: null,
  current_loss: null,
  carryforward_loss: null,
  has_tax_credit: false,
  tax_credit_type: '',
  tax_credit_increase: null,
  tax_credit_carryforward: null,
  tax_credit_note: '',
  requires_faithful_report: false,
  faithful_report_note: '',
  additional_notes: '',
  rural_tax: null,
})

function numInput(
  label: string,
  value: number | null,
  onChange: (v: number | null) => void,
  placeholder = '0'
) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
      />
    </div>
  )
}

export default function CorporateTaxClient({ clients, initialReports }: Props) {
  const [isPending, startTransition] = useTransition()
  const [reports, setReports] = useState(initialReports)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [deleteTarget, setDeleteTarget] = useState<CorporateTaxReport | null>(null)
  const [printingReport, setPrintingReport] = useState<CorporateTaxReport | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // 자동 계산
  const calcTax = form.net_profit != null ? Math.round(calculateCorporateTax(form.net_profit)) : null
  const localTax = calcTax != null ? calculateLocalTax(calcTax) : null
  const determinedTax =
    calcTax != null
      ? calcTax +
        (localTax ?? 0) +
        (form.rural_tax ?? 0) -
        (form.tax_credit_increase ?? 0) -
        (form.tax_payment ?? 0) -
        (form.prepaid_tax ?? 0)
      : null

  const openNew = () => {
    setEditingId(null)
    setForm(defaultForm())
    setShowForm(true)
  }

  const openEdit = (report: CorporateTaxReport) => {
    setEditingId(report.id)
    setForm({
      client_id: report.client_id,
      year: report.year,
      revenue: report.revenue,
      net_profit: report.net_profit,
      tax_payment: report.tax_payment,
      tax_refund: report.tax_refund,
      prepaid_tax: report.prepaid_tax,
      current_loss: report.current_loss,
      carryforward_loss: report.carryforward_loss,
      has_tax_credit: report.has_tax_credit,
      tax_credit_type: report.tax_credit_type ?? '',
      tax_credit_increase: report.tax_credit_increase,
      tax_credit_carryforward: report.tax_credit_carryforward,
      tax_credit_note: report.tax_credit_note ?? '',
      requires_faithful_report: report.requires_faithful_report,
      faithful_report_note: report.faithful_report_note ?? '',
      additional_notes: report.additional_notes ?? '',
      rural_tax: report.rural_tax,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id) {
      setToast({ message: '고객을 선택하세요.', type: 'error' })
      return
    }

    const payload: CorporateTaxReportInsert = {
      client_id: form.client_id,
      year: form.year,
      revenue: form.revenue,
      net_profit: form.net_profit,
      tax_payment: form.tax_payment,
      tax_refund: form.tax_refund,
      prepaid_tax: form.prepaid_tax,
      current_loss: form.current_loss,
      carryforward_loss: form.carryforward_loss,
      has_tax_credit: form.has_tax_credit,
      tax_credit_type: form.tax_credit_type || null,
      tax_credit_increase: form.tax_credit_increase,
      tax_credit_carryforward: form.tax_credit_carryforward,
      tax_credit_note: form.tax_credit_note || null,
      requires_faithful_report: form.requires_faithful_report,
      faithful_report_note: form.faithful_report_note || null,
      additional_notes: form.additional_notes || null,
      income_statement: null,
      financial_statements: null,
      calculated_tax: calcTax,
      local_tax: localTax,
      rural_tax: form.rural_tax,
      determined_tax: determinedTax,
    }

    startTransition(async () => {
      try {
        const saved = await upsertCorporateTaxReportAction(payload)
        setReports((prev) => {
          const exists = prev.find((r) => r.id === saved.id)
          if (exists) return prev.map((r) => (r.id === saved.id ? saved : r))
          return [saved, ...prev]
        })
        setToast({ message: '저장되었습니다.', type: 'success' })
        setShowForm(false)
      } catch (err) {
        setToast({
          message: err instanceof Error ? err.message : '저장에 실패했습니다.',
          type: 'error',
        })
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteCorporateTaxReportAction(deleteTarget.id, deleteTarget.client_id)
        setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id))
        setDeleteTarget(null)
        setToast({ message: '삭제되었습니다.', type: 'success' })
      } catch {
        setToast({ message: '삭제에 실패했습니다.', type: 'error' })
      }
    })
  }

  const handlePrint = useReactToPrint({ contentRef: printRef })

  const handlePrintReport = (report: CorporateTaxReport) => {
    flushSync(() => setPrintingReport(report))
    handlePrint()
  }

  const clientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.company_name ?? '-'

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">법인세 보고서</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {reports.length}건</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} />
          새 보고서
        </Button>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">고객명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">사업연도</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">매출액</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">산출세액</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">결정세액</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">작성일</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">작업</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  작성된 보고서가 없습니다.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{clientName(r.client_id)}</td>
                  <td className="px-4 py-3 text-gray-600">{r.year}년</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(r.revenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(r.calculated_tax)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(r.determined_tax)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handlePrintReport(r)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="인쇄"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 보고서 작성/수정 모달 */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? '보고서 수정' : '새 보고서 작성'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">고객 선택 *</label>
              <select
                value={form.client_id}
                onChange={(e) => set('client_id', e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">고객을 선택하세요</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사업연도</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => set('year', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 매출 / 손익 */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
              매출 및 손익
            </p>
            <div className="grid grid-cols-2 gap-4">
              {numInput('매출액', form.revenue, (v) => set('revenue', v))}
              {numInput('당기순이익 (과세표준)', form.net_profit, (v) => set('net_profit', v))}
              {numInput('당기결손금', form.current_loss, (v) => set('current_loss', v))}
              {numInput('이월결손금', form.carryforward_loss, (v) => set('carryforward_loss', v))}
            </div>
          </div>

          {/* 세금 계산 */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-100">
              세금 계산
            </p>
            <div className="grid grid-cols-2 gap-4">
              {numInput('중간예납세액', form.tax_payment, (v) => set('tax_payment', v))}
              {numInput('기납부세액', form.prepaid_tax, (v) => set('prepaid_tax', v))}
              {numInput('환급세액', form.tax_refund, (v) => set('tax_refund', v))}
              {numInput('농어촌특별세', form.rural_tax, (v) => set('rural_tax', v))}
            </div>

            {/* 자동계산 결과 */}
            {calcTax != null && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-gray-700 mb-2">자동 계산 결과</p>
                <div className="flex justify-between">
                  <span className="text-gray-500">산출세액</span>
                  <span className="font-medium">{formatCurrency(calcTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">지방소득세 (10%)</span>
                  <span className="font-medium">{formatCurrency(localTax)}</span>
                </div>
                {(form.rural_tax ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">농어촌특별세</span>
                    <span className="font-medium">{formatCurrency(form.rural_tax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-800">결정세액</span>
                  <span className="font-bold text-indigo-700">{formatCurrency(determinedTax)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 세액공제 */}
          <div>
            <div className="flex items-center gap-3 mb-3 pb-1 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">세액공제</p>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.has_tax_credit}
                  onChange={(e) => set('has_tax_credit', e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-gray-600">해당 있음</span>
              </label>
            </div>
            {form.has_tax_credit && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">세액공제 유형</label>
                  <input
                    type="text"
                    value={form.tax_credit_type}
                    onChange={(e) => set('tax_credit_type', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                    placeholder="예: 중소기업 투자세액공제"
                  />
                </div>
                {numInput('해당연도 증가금액', form.tax_credit_increase, (v) => set('tax_credit_increase', v))}
                {numInput('이월공제금액', form.tax_credit_carryforward, (v) => set('tax_credit_carryforward', v))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                  <input
                    type="text"
                    value={form.tax_credit_note}
                    onChange={(e) => set('tax_credit_note', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 성실신고 */}
          <div>
            <div className="flex items-center gap-3 mb-3 pb-1 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">성실신고</p>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requires_faithful_report}
                  onChange={(e) => set('requires_faithful_report', e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="text-sm text-gray-600">성실신고 확인 해당</span>
              </label>
            </div>
            {form.requires_faithful_report && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                <input
                  type="text"
                  value={form.faithful_report_note}
                  onChange={(e) => set('faithful_report_note', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* 추가사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">추가사항</label>
            <textarea
              value={form.additional_notes}
              onChange={(e) => set('additional_notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>취소</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 삭제 확인 */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="보고서 삭제" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{deleteTarget && clientName(deleteTarget.client_id)}</strong> ({deleteTarget?.year}년) 보고서를 삭제하시겠습니까?
            <br />
            <span className="text-red-500 text-xs">이 작업은 되돌릴 수 없습니다.</span>
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} disabled={isPending}>삭제</Button>
          </div>
        </div>
      </Modal>

      {/* 인쇄 레이아웃 */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} style={{ fontFamily: 'serif', padding: '40px', color: '#000', fontSize: '13px' }}>
          {printingReport && (() => {
            const pClient = clients.find((c) => c.id === printingReport.client_id)
            return (
              <>
                {/* 헤더 */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>아톰세무회계</div>
                  <h1 style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '4px', margin: '0 0 4px' }}>
                    법인세 신고 현황
                  </h1>
                  <div style={{ fontSize: '15px', marginTop: '4px', color: '#333' }}>
                    {printingReport.year}년도
                  </div>
                  <div style={{ borderBottom: '2px solid #000', marginTop: '12px' }} />
                </div>

                {/* 고객 정보 */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '5px 0', width: '120px', color: '#555' }}>상호명</td>
                      <td style={{ padding: '5px 0', fontWeight: 'bold' }}>{pClient?.company_name ?? '-'}</td>
                      <td style={{ padding: '5px 0', width: '120px', color: '#555' }}>사업자번호</td>
                      <td style={{ padding: '5px 0' }}>{pClient?.business_number ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 세금 계산 */}
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontWeight: 'bold', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '8px' }}>
                    ■ 세금 계산 내역
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        { label: '매출액', value: printingReport.revenue },
                        { label: '당기순이익 (과세표준)', value: printingReport.net_profit },
                        { label: '당기결손금', value: printingReport.current_loss },
                        { label: '이월결손금', value: printingReport.carryforward_loss },
                        { label: '산출세액', value: printingReport.calculated_tax },
                        { label: '지방소득세 (10%)', value: printingReport.local_tax },
                        { label: '농어촌특별세', value: printingReport.rural_tax },
                        { label: '중간예납세액', value: printingReport.tax_payment },
                        { label: '기납부세액', value: printingReport.prepaid_tax },
                      ]
                        .filter((row) => row.value != null && row.value !== 0)
                        .map((row) => (
                          <tr key={row.label} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '6px 8px', color: '#444' }}>{row.label}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                              {formatCurrency(row.value)}
                            </td>
                          </tr>
                        ))}
                      <tr style={{ borderTop: '2px solid #000' }}>
                        <td style={{ padding: '8px 8px', fontWeight: 'bold' }}>결정세액</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                          {formatCurrency(printingReport.determined_tax)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 세액공제 */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: 'bold', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '8px' }}>
                    ■ 세액공제
                  </p>
                  <p>세액공제 적용: {printingReport.has_tax_credit ? '있음' : '없음'}</p>
                  {printingReport.has_tax_credit && (
                    <>
                      {printingReport.tax_credit_type && <p>유형: {printingReport.tax_credit_type}</p>}
                      {printingReport.tax_credit_increase != null && (
                        <p>해당연도 증가금액: {formatCurrency(printingReport.tax_credit_increase)}</p>
                      )}
                      {printingReport.tax_credit_carryforward != null && (
                        <p>이월공제금액: {formatCurrency(printingReport.tax_credit_carryforward)}</p>
                      )}
                      {printingReport.tax_credit_note && <p>비고: {printingReport.tax_credit_note}</p>}
                    </>
                  )}
                </div>

                {/* 성실신고 */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: 'bold', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '8px' }}>
                    ■ 성실신고
                  </p>
                  <p>성실신고 확인: {printingReport.requires_faithful_report ? '해당' : '해당 없음'}</p>
                  {printingReport.faithful_report_note && (
                    <p>비고: {printingReport.faithful_report_note}</p>
                  )}
                </div>

                {/* 추가사항 */}
                {printingReport.additional_notes && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontWeight: 'bold', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '8px' }}>
                      ■ 추가사항
                    </p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{printingReport.additional_notes}</p>
                  </div>
                )}

                {/* 하단 */}
                <div style={{ marginTop: '40px', textAlign: 'right' }}>
                  <p style={{ color: '#555', marginBottom: '4px' }}>작성일: {today}</p>
                  <p style={{ fontWeight: 'bold', fontSize: '14px' }}>아톰세무회계</p>
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
