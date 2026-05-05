'use client'

import { useState, useTransition, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useReactToPrint } from 'react-to-print'
import { Plus, Printer, Trash2, Pencil } from 'lucide-react'
import type { Client, AdjustmentInvoice, AdjustmentInvoiceInsert } from '@/types/database'
import { calculateCorporateSettlementFee } from '@/lib/utils/fee-calculator'
import { formatCurrency, formatDate, formatBusinessNumber } from '@/lib/utils/format'
import {
  createAdjustmentInvoiceAction,
  updateAdjustmentInvoiceAction,
  deleteAdjustmentInvoiceAction,
} from './actions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Toast, { type ToastType } from '@/components/ui/Toast'

interface Props {
  clients: Client[]
  initialInvoices: AdjustmentInvoice[]
}

interface FormState {
  client_id: string
  client_name: string
  business_number: string
  business_type: 'corporate' | 'individual'
  year: number
  revenue: number
  settlement_fee: number
  adjustment_fee: number
  tax_credit_additional: number
  faithful_report_fee: number
  discount: number
}

const defaultForm = (): FormState => ({
  client_id: '',
  client_name: '',
  business_number: '',
  business_type: 'corporate',
  year: new Date().getFullYear() - 1,
  revenue: 0,
  settlement_fee: 0,
  adjustment_fee: 0,
  tax_credit_additional: 0,
  faithful_report_fee: 0,
  discount: 0,
})

export default function AdjustmentInvoiceClient({ clients, initialInvoices }: Props) {
  const [isPending, startTransition] = useTransition()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [deleteTarget, setDeleteTarget] = useState<AdjustmentInvoice | null>(null)
  const [printingInvoice, setPrintingInvoice] = useState<AdjustmentInvoice | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const finalFee =
    form.settlement_fee +
    form.adjustment_fee +
    form.tax_credit_additional +
    form.faithful_report_fee -
    form.discount

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    setForm((prev) => ({
      ...prev,
      client_id: clientId,
      client_name: client?.company_name ?? '',
      business_number: client?.business_number ?? '',
      business_type:
        client?.business_type_category === '법인' ? 'corporate' : 'individual',
    }))
  }

  const handleRevenueChange = (revenue: number) => {
    const newSettlementFee =
      form.business_type === 'corporate'
        ? Math.round(calculateCorporateSettlementFee(revenue))
        : form.settlement_fee
    setForm((prev) => ({ ...prev, revenue, settlement_fee: newSettlementFee }))
  }

  const handleBusinessTypeChange = (bt: 'corporate' | 'individual') => {
    const newSettlementFee =
      bt === 'corporate'
        ? Math.round(calculateCorporateSettlementFee(form.revenue))
        : 0
    setForm((prev) => ({ ...prev, business_type: bt, settlement_fee: newSettlementFee }))
  }

  const openNew = () => {
    setEditingId(null)
    setForm(defaultForm())
    setShowForm(true)
  }

  const openEdit = (invoice: AdjustmentInvoice) => {
    setEditingId(invoice.id)
    setForm({
      client_id: invoice.client_id ?? '',
      client_name: invoice.client_name,
      business_number: invoice.business_number ?? '',
      business_type: invoice.business_type,
      year: invoice.year ?? new Date().getFullYear() - 1,
      revenue: invoice.revenue,
      settlement_fee: invoice.settlement_fee,
      adjustment_fee: invoice.adjustment_fee,
      tax_credit_additional: invoice.tax_credit_additional,
      faithful_report_fee: invoice.faithful_report_fee,
      discount: invoice.discount,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: AdjustmentInvoiceInsert = {
      client_id: form.client_id || null,
      client_name: form.client_name,
      business_number: form.business_number || null,
      business_type: form.business_type,
      year: form.year,
      revenue: form.revenue,
      settlement_fee: form.settlement_fee,
      adjustment_fee: form.adjustment_fee,
      tax_credit_additional: form.tax_credit_additional,
      faithful_report_fee: form.faithful_report_fee,
      discount: form.discount,
      final_fee: finalFee,
    }

    startTransition(async () => {
      try {
        if (editingId) {
          await updateAdjustmentInvoiceAction(editingId, payload)
          setInvoices((prev) =>
            prev.map((inv) =>
              inv.id === editingId ? { ...inv, ...payload } : inv
            )
          )
          setToast({ message: '수정되었습니다.', type: 'success' })
        } else {
          const created = await createAdjustmentInvoiceAction(payload)
          setInvoices((prev) => [created, ...prev])
          setToast({ message: '저장되었습니다.', type: 'success' })
        }
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
        await deleteAdjustmentInvoiceAction(deleteTarget.id)
        setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id))
        setDeleteTarget(null)
        setToast({ message: '삭제되었습니다.', type: 'success' })
      } catch {
        setToast({ message: '삭제에 실패했습니다.', type: 'error' })
      }
    })
  }

  const handlePrint = useReactToPrint({ contentRef: printRef })

  const handlePrintInvoice = (invoice: AdjustmentInvoice) => {
    flushSync(() => setPrintingInvoice(invoice))
    handlePrint()
  }

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
          <h1 className="text-xl font-semibold text-gray-900">조정료 청구서</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {invoices.length}건</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} />
          새 청구서
        </Button>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">고객명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">구분</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">사업연도</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">매출액</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">청구금액</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">작성일</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">작업</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  작성된 청구서가 없습니다.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.client_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.business_type === 'corporate'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}>
                      {inv.business_type === 'corporate' ? '법인' : '개인'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.year ?? '-'}년</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(inv.revenue)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(inv.final_fee)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(inv.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handlePrintInvoice(inv)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="인쇄"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(inv)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(inv)}
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

      {/* 청구서 작성/수정 모달 */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? '청구서 수정' : '새 청구서 작성'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">고객 선택</label>
              <select
                value={form.client_id}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">직접 입력</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
              <select
                value={form.business_type}
                onChange={(e) => handleBusinessTypeChange(e.target.value as 'corporate' | 'individual')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
              >
                <option value="corporate">법인</option>
                <option value="individual">개인</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">고객명 *</label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => set('client_name', e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                placeholder="상호명"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호</label>
              <input
                type="text"
                value={form.business_number}
                onChange={(e) => set('business_number', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                placeholder="000-00-00000"
              />
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">매출액</label>
              <input
                type="number"
                value={form.revenue || ''}
                onChange={(e) => handleRevenueChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* 수수료 항목 */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">수수료 항목</p>
            <div className="space-y-3">
              {[
                {
                  key: 'settlement_fee' as const,
                  label: '결산조정료',
                  hint: form.business_type === 'corporate' ? '매출액 기준 자동계산' : '직접 입력',
                },
                { key: 'adjustment_fee' as const, label: '조정료', hint: '' },
                { key: 'tax_credit_additional' as const, label: '세액공제 추가', hint: '' },
                { key: 'faithful_report_fee' as const, label: '성실신고 확인료', hint: '' },
                { key: 'discount' as const, label: '할인 (차감)', hint: '' },
              ].map(({ key, label, hint }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-36 text-sm text-gray-600 shrink-0">
                    {label}
                    {hint && <span className="text-xs text-gray-400 block">{hint}</span>}
                  </label>
                  <input
                    type="number"
                    value={form[key] || ''}
                    onChange={(e) => set(key, Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-right"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500 w-4">원</span>
                </div>
              ))}
            </div>
          </div>

          {/* 합계 */}
          <div className="bg-indigo-50 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-900">최종 청구금액</span>
            <span className="text-lg font-bold text-indigo-700">{formatCurrency(finalFee)}</span>
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
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="청구서 삭제" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong>{deleteTarget?.client_name}</strong> ({deleteTarget?.year}년) 청구서를 삭제하시겠습니까?
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
        <div ref={printRef} style={{ fontFamily: 'serif', padding: '40px', color: '#000' }}>
          {printingInvoice && (
            <>
              {/* 헤더 */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>아톰세무회계</div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '8px', margin: '0 0 4px' }}>
                  조정료 청구서
                </h1>
                <div style={{ borderBottom: '2px solid #000', marginTop: '12px' }} />
              </div>

              {/* 청구일 */}
              <div style={{ textAlign: 'right', marginBottom: '24px', fontSize: '13px' }}>
                청구일: {today}
              </div>

              {/* 고객 정보 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 0', width: '120px', color: '#555' }}>고객명</td>
                    <td style={{ padding: '6px 0', fontWeight: 'bold' }}>{printingInvoice.client_name}</td>
                    <td style={{ padding: '6px 0', width: '120px', color: '#555' }}>구분</td>
                    <td style={{ padding: '6px 0' }}>
                      {printingInvoice.business_type === 'corporate' ? '법인' : '개인'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0', color: '#555' }}>사업자번호</td>
                    <td style={{ padding: '6px 0' }}>{formatBusinessNumber(printingInvoice.business_number)}</td>
                    <td style={{ padding: '6px 0', color: '#555' }}>사업연도</td>
                    <td style={{ padding: '6px 0' }}>{printingInvoice.year}년도</td>
                  </tr>
                  {printingInvoice.revenue > 0 && (
                    <tr>
                      <td style={{ padding: '6px 0', color: '#555' }}>매출액</td>
                      <td colSpan={3} style={{ padding: '6px 0' }}>
                        {formatCurrency(printingInvoice.revenue)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 수수료 명세 */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderTop: '2px solid #000', borderBottom: '1px solid #ccc' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 'bold' }}>항목</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold' }}>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {printingInvoice.settlement_fee > 0 && (
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>결산조정료</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {formatCurrency(printingInvoice.settlement_fee)}
                      </td>
                    </tr>
                  )}
                  {printingInvoice.adjustment_fee > 0 && (
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>조정료</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {formatCurrency(printingInvoice.adjustment_fee)}
                      </td>
                    </tr>
                  )}
                  {printingInvoice.tax_credit_additional > 0 && (
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>세액공제 추가</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {formatCurrency(printingInvoice.tax_credit_additional)}
                      </td>
                    </tr>
                  )}
                  {printingInvoice.faithful_report_fee > 0 && (
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>성실신고 확인료</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {formatCurrency(printingInvoice.faithful_report_fee)}
                      </td>
                    </tr>
                  )}
                  {printingInvoice.discount > 0 && (
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>할인</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e00' }}>
                        -{formatCurrency(printingInvoice.discount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #000' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', fontSize: '15px' }}>
                      최종 청구금액
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                      {formatCurrency(printingInvoice.final_fee)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* 하단 */}
              <div style={{ marginTop: '48px', textAlign: 'center', fontSize: '13px', color: '#555' }}>
                위 금액을 청구합니다.
              </div>
              <div style={{ marginTop: '32px', textAlign: 'right', fontSize: '14px' }}>
                <div style={{ fontWeight: 'bold' }}>아톰세무회계</div>
                <div style={{ marginTop: '4px', color: '#555' }}>대표자 (인)</div>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
