'use client'

import { useState } from 'react'
import { Calculator, RotateCcw } from 'lucide-react'
import {
  AddressSearchInput,
  type AddressSelection,
} from '@/components/calculator/AddressSearchInput'
import { DecimalInput, NumberInput } from '@/components/calculator/NumberInput'
import { VatResultPanel } from '@/components/calculator/VatResultPanel'
import {
  calculateVatAllocation,
  type VatAllocationResult,
} from '@/lib/calculators/vat-allocation'

interface FormState {
  address: string
  detailLocation: string
  landArea: number
  buildingArea: number
  sellingPrice: number
  landUnitPrice: number
  buildingStandardValue: number
}

const INITIAL_FORM: FormState = {
  address: '',
  detailLocation: '',
  landArea: 0,
  buildingArea: 0,
  sellingPrice: 0,
  landUnitPrice: 0,
  buildingStandardValue: 0,
}

export function VatCalculatorClient() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VatAllocationResult | null>(null)
  const [resultSellingPrice, setResultSellingPrice] = useState<number>(0)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleAddressSelect(sel: AddressSelection) {
    setForm((prev) => ({ ...prev, address: sel.roadAddress || sel.jibunAddress }))
  }

  function handleReset() {
    setForm(INITIAL_FORM)
    setError(null)
    setResult(null)
    setResultSellingPrice(0)
  }

  function handleCalculate() {
    const computed = calculateVatAllocation({
      sellingPrice: form.sellingPrice,
      landArea: form.landArea,
      landUnitPrice: form.landUnitPrice,
      buildingStandardValue: form.buildingStandardValue,
    })

    if (!computed) {
      setError('매도예상가, 토지면적, 토지공시지가, 건물기준시가를 모두 0보다 큰 값으로 입력해주세요.')
      setResult(null)
      return
    }

    setError(null)
    setResult(computed)
    setResultSellingPrice(form.sellingPrice)
  }

  return (
    <div className="space-y-5">
      {/* 1. 기본 정보 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-800">📍 기본 정보</h2>

        <Field label="물건 위치" required>
          <AddressSearchInput
            value={form.address}
            onChange={(v) => update('address', v)}
            onSelect={handleAddressSelect}
          />
        </Field>

        <Field label="상세 위치" hint="동호수 등 상세 위치를 입력하세요.">
          <input
            type="text"
            value={form.detailLocation}
            onChange={(e) => update('detailLocation', e.target.value)}
            placeholder="예: 101동 801호"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="토지 면적(㎡)" required>
            <DecimalInput
              value={form.landArea}
              onChange={(v) => update('landArea', v)}
              placeholder="예: 21.7512"
            />
          </Field>
          <Field
            label="건물 면적(㎡)"
            required
            hint="공용부 + 전유부 모두 포함합니다."
          >
            <DecimalInput
              value={form.buildingArea}
              onChange={(v) => update('buildingArea', v)}
              placeholder="예: 242.8263"
            />
          </Field>
        </div>

        <Field
          label="매도예상가 (원)"
          required
          hint="VAT 포함 총액. 숫자만 입력하세요. (예: 7억 4천만원 → 740000000)"
        >
          <NumberInput
            value={form.sellingPrice}
            onChange={(v) => update('sellingPrice', v)}
            placeholder="예: 740,000,000"
          />
        </Field>
      </section>

      {/* 2. 조회 정보 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-bold text-gray-800">💰 조회 정보</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
          <p className="font-semibold mb-1">ℹ️ 조회 정보 안내</p>
          <p>
            토지공시지가는 <a className="underline" href="https://www.realtyprice.kr" target="_blank" rel="noopener noreferrer">개별공시지가 조회</a>에서,
            건물기준시가는 <a className="underline" href="https://xn--mq1bt2icze.com" target="_blank" rel="noopener noreferrer">건물기준시가 계산기</a>에서 확인 후 입력하세요.
          </p>
        </div>

        <Field
          label="토지공시지가(원/㎡)"
          required
          hint="realtyprice.kr에서 개별공시지가 최근자 확인"
        >
          <NumberInput
            value={form.landUnitPrice}
            onChange={(v) => update('landUnitPrice', v)}
            placeholder="예: 3,553,000"
          />
        </Field>

        <Field
          label="건물기준시가 (전체 금액, 원)"
          required
          hint="건물기준시가 계산기에서 계산된 전체 금액 입력"
        >
          <NumberInput
            value={form.buildingStandardValue}
            onChange={(v) => update('buildingStandardValue', v)}
            placeholder="예: 265,800,000"
          />
        </Field>
      </section>

      {/* 3. 액션 */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleCalculate}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-medium shadow hover:shadow-md transition-shadow"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Calculator size={16} /> 부가가치세 계산하기
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1"
        >
          <RotateCcw size={14} /> 초기화
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <VatResultPanel result={result} sellingPrice={resultSellingPrice} />
      )}
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}
