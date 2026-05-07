'use client'

import { useState, useTransition, useEffect } from 'react'
import { X, Search, AlertTriangle } from 'lucide-react'
import type { Client, ClientInsert, ClientUpdate, BusinessTypeCategory } from '@/types/database'
import {
  createClientAction,
  updateClientAction,
  getNextClientNumberAction,
} from '@/app/(dashboard)/clients/actions'
import PostalCodeSearch from './PostalCodeSearch'
import {
  formatPhoneNumber,
  formatBusinessNumberForSave,
  formatResidentNumber,
  formatCorporateNumber,
} from '@/lib/utils/format-phone'
import { normalizeBillingMonth } from '@/lib/utils/format'

type FormData = {
  number: string
  company_name: string
  manager: string
  representative: string
  phone: string
  email: string
  google_drive_folder_url: string
  trader_drive_folder_url: string
  business_number: string
  business_type_category: BusinessTypeCategory
  resident_number: string
  corporate_number: string
  business_type: string
  business_item: string
  business_category_code: string
  postal_code: string
  address: string
  is_terminated: boolean
  supply_value: string
  tax_value: string
  initial_billing_month: string
  hometax_id: string
  hometax_password: string
  notes: string
}

type Props = {
  client?: Client
  onClose: () => void
  onSaved: (client: Client) => void
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
        {title}
      </div>
      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
    </div>
  )
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-xs text-gray-600 mb-1">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function TextInput({
  label, value, onChange, onBlur, placeholder, required, colSpan, type,
}: {
  label: string; value: string; onChange: (v: string) => void
  onBlur?: (v: string) => void
  placeholder?: string; required?: boolean; colSpan?: boolean; type?: string
}) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <Label text={label} required={required} />
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
      />
    </div>
  )
}

export default function ClientFormModal({ client, onClose, onSaved }: Props) {
  const isEdit = !!client
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    number: client?.number ?? '',
    company_name: client?.company_name ?? '',
    manager: client?.manager ?? '',
    representative: client?.representative ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    google_drive_folder_url: client?.google_drive_folder_url ?? '',
    trader_drive_folder_url: client?.trader_drive_folder_url ?? '',
    business_number: client?.business_number ?? '',
    business_type_category: client?.business_type_category ?? '개인',
    resident_number: client?.resident_number ?? '',
    corporate_number: client?.corporate_number ?? '',
    business_type: client?.business_type ?? '',
    business_item: client?.business_item ?? '',
    business_category_code: client?.business_category_code ?? '',
    postal_code: client?.postal_code ?? '',
    address: client?.address ?? '',
    is_terminated: client?.is_terminated ?? false,
    supply_value: client?.supply_value ? String(client.supply_value) : '',
    tax_value: client?.tax_value ? String(client.tax_value) : '',
    initial_billing_month: normalizeBillingMonth(client?.initial_billing_month) ?? '',
    hometax_id: client?.hometax_id ?? '',
    hometax_password: client?.hometax_password ?? '',
    notes: client?.notes ?? '',
  })

  useEffect(() => {
    if (!isEdit && !form.number) {
      getNextClientNumberAction().then((n) => set('number', n))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSupplyChange = (v: string) => {
    set('supply_value', v)
    const n = parseInt(v.replace(/,/g, ''))
    if (!isNaN(n)) {
      set('tax_value', String(Math.round(n * 0.1)))
    } else {
      set('tax_value', '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.company_name.trim()) { setError('거래처명은 필수입니다.'); return }
    if (!form.manager.trim()) { setError('담당자는 필수입니다.'); return }

    const payload: ClientInsert = {
      number: form.number || null,
      company_name: form.company_name.trim(),
      manager: form.manager.trim() || null,
      representative: form.representative.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      business_number: form.business_number.trim() || null,
      corporate_number: form.corporate_number.trim() || null,
      business_type: form.business_type.trim() || null,
      business_item: form.business_item.trim() || null,
      business_type_category: form.business_type_category,
      is_terminated: form.is_terminated,
      termination_date: form.is_terminated ? (client?.termination_date ?? new Date().toISOString().slice(0, 10)) : null,
      notes: form.notes.trim() || null,
      // 기존 미사용 컬럼 보존
      start_date: client?.start_date ?? null,
      end_date: client?.end_date ?? null,
      contract_amount: client?.contract_amount ?? null,
      supply_amount: client?.supply_amount ?? null,
      tax_amount: client?.tax_amount ?? null,
      // v12 신규
      email: form.email.trim() || null,
      google_drive_folder_url: form.google_drive_folder_url.trim() || null,
      trader_drive_folder_url: form.trader_drive_folder_url.trim() || null,
      resident_number: form.resident_number.trim() || null,
      business_category_code: form.business_category_code.trim() || null,
      postal_code: form.postal_code.trim() || null,
      supply_value: parseInt(form.supply_value.replace(/,/g, '')) || 0,
      tax_value: parseInt(form.tax_value.replace(/,/g, '')) || 0,
      initial_billing_month: normalizeBillingMonth(form.initial_billing_month) || null,
      hometax_id: form.hometax_id.trim() || null,
      hometax_password: form.hometax_password || null,
    }

    startTransition(async () => {
      try {
        let saved: Client
        if (isEdit) {
          const update: ClientUpdate = payload
          saved = await updateClientAction(client.id, update)
        } else {
          saved = await createClientAction(payload)
        }
        onSaved(saved)
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '고객 수정' : '고객 추가'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          {/* 기본 정보 */}
          <FieldGroup title="기본 정보">
            <div>
              <Label text="번호" />
              <input
                type="text"
                value={form.number}
                onChange={(e) => set('number', e.target.value)}
                placeholder="자동"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
            <TextInput label="거래처명" value={form.company_name} onChange={(v) => set('company_name', v)} placeholder="(주)아톰세무" required />
            <TextInput label="담당자" value={form.manager} onChange={(v) => set('manager', v)} placeholder="홍길동" required />
            <TextInput label="대표자" value={form.representative} onChange={(v) => set('representative', v)} placeholder="김대표" />
            <TextInput label="연락처" value={form.phone} onChange={(v) => set('phone', v)} onBlur={(v) => set('phone', formatPhoneNumber(v))} placeholder="010-0000-0000" />
            <TextInput label="이메일" value={form.email} onChange={(v) => set('email', v)} placeholder="info@example.com" type="email" />
            <div className="col-span-2">
              <Label text="구글 드라이브 폴더 URL" />
              <input
                type="url"
                value={form.google_drive_folder_url}
                onChange={(e) => set('google_drive_folder_url', e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <Label text="매매사업자 부동산 폴더 URL" />
              <input
                type="url"
                value={form.trader_drive_folder_url}
                onChange={(e) => set('trader_drive_folder_url', e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
          </FieldGroup>

          {/* 사업자 정보 */}
          <FieldGroup title="사업자 정보">
            <TextInput label="사업자번호" value={form.business_number} onChange={(v) => set('business_number', v)} onBlur={(v) => set('business_number', formatBusinessNumberForSave(v))} placeholder="000-00-00000" />
            <div>
              <Label text="사업자구분" required />
              <select
                value={form.business_type_category}
                onChange={(e) => set('business_type_category', e.target.value as BusinessTypeCategory)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              >
                <option value="개인">개인사업자</option>
                <option value="법인">법인사업자</option>
              </select>
            </div>
            <TextInput label="주민등록번호" value={form.resident_number} onChange={(v) => set('resident_number', v)} onBlur={(v) => set('resident_number', formatResidentNumber(v))} placeholder="000000-0000000" />
            <TextInput label="법인등록번호" value={form.corporate_number} onChange={(v) => set('corporate_number', v)} onBlur={(v) => set('corporate_number', formatCorporateNumber(v))} placeholder="000000-0000000" />
            <TextInput label="업태" value={form.business_type} onChange={(v) => set('business_type', v)} placeholder="서비스업" />
            <TextInput label="종목" value={form.business_item} onChange={(v) => set('business_item', v)} placeholder="세무대리" />
            <div className="col-span-2">
              <Label text="업종코드" />
              <input
                type="text"
                value={form.business_category_code}
                onChange={(e) => set('business_category_code', e.target.value)}
                placeholder="749303"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <Label text="우편번호" />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.postal_code}
                  onChange={(e) => set('postal_code', e.target.value)}
                  placeholder="00000"
                  readOnly
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50"
                />
                <PostalCodeSearch
                  onComplete={({ postalCode, address }) => {
                    set('postal_code', postalCode)
                    set('address', address)
                  }}
                >
                  {(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 whitespace-nowrap"
                    >
                      <Search size={12} />
                      검색
                    </button>
                  )}
                </PostalCodeSearch>
              </div>
            </div>
            <div className="col-span-2">
              <Label text="사업장 주소" />
              <input
                type="text"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="서울시 ..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
          </FieldGroup>

          {/* 세무 정보 */}
          <FieldGroup title="세무 정보">
            {/* 해임여부 */}
            <div className="col-span-2 border border-red-200 rounded-lg p-3 bg-red-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_terminated}
                  onChange={(e) => set('is_terminated', e.target.checked)}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm font-medium text-red-700">해임여부</span>
              </label>
              {form.is_terminated && (
                <p className="text-xs text-red-600 mt-1 ml-6">
                  ※ 저장 시 해임고객 관리 페이지로 이동됩니다.
                </p>
              )}
            </div>

            <div>
              <Label text="공급가액" />
              <input
                type="text"
                value={form.supply_value}
                onChange={(e) => handleSupplyChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                세액 <span className="text-gray-400 font-normal">(공급가액 10% 자동, 직접 수정 가능)</span>
              </label>
              <input
                type="text"
                value={form.tax_value}
                onChange={(e) => set('tax_value', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <Label text="최초출금월" />
              <input
                type="month"
                value={form.initial_billing_month}
                onChange={(e) => set('initial_billing_month', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div />

            {/* 홈택스 정보 경고 박스 */}
            <div className="col-span-2 border border-yellow-300 rounded-lg p-3 bg-yellow-50">
              <div className="flex items-center gap-1.5 text-yellow-700 text-xs font-medium mb-2">
                <AlertTriangle size={14} />
                민감한 정보입니다. 외부 유출에 주의하세요.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label text="홈택스 아이디" />
                  <input
                    type="text"
                    value={form.hometax_id}
                    onChange={(e) => set('hometax_id', e.target.value)}
                    placeholder="홈택스 로그인 아이디"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <Label text="홈택스 비밀번호" />
                  <input
                    type="text"
                    value={form.hometax_password}
                    onChange={(e) => set('hometax_password', e.target.value)}
                    placeholder="홈택스 로그인 비밀번호"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            </div>
          </FieldGroup>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">
              {error}
            </p>
          )}
        </form>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
