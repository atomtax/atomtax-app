'use client'

import { useRef, useState } from 'react'
import { Calculator, Download, RotateCcw } from 'lucide-react'
import {
  AddressSearchInput,
  type AddressSelection,
} from '@/components/calculator/AddressSearchInput'
import { AreaInput } from '@/components/calculator/AreaInput'
import {
  BuildingAreaField,
  type AutoLookupMeta,
} from '@/components/calculator/BuildingAreaField'
import { BuildingStandardValueField } from '@/components/calculator/BuildingStandardValueField'
import { LandValueField } from '@/components/calculator/LandValueField'
import { NumberInput } from '@/components/calculator/NumberInput'
import { VatResultPanel } from '@/components/calculator/VatResultPanel'
import { STRUCTURES } from '@/lib/calculators/building-standard-data'
import {
  getBuildingUseByCode,
  groupBuildingUsesBySubCategory,
  SUB_CATEGORY_ORDER,
  type BuildingUseCategory,
  type BuildingUseSubCategory,
} from '@/lib/data/building-use-codes'
import {
  calculateVatAllocation,
  type VatAllocationResult,
} from '@/lib/calculators/vat-allocation'

interface FormState {
  address: string
  dongInput: string
  hoInput: string
  isBasement: boolean
  landArea: number
  buildingArea: number
  sellingPrice: number
  landUnitPrice: number
  buildingStandardValue: number
  structureId: string
  /** 용도 1차 분기 (주거용/상업용) */
  useCategory: BuildingUseCategory
  /** BUILDING_USES.code의 string 형태 ('1' = 아파트, '2' = 단독·다세대 등) */
  usageId: string
  completionYear: string
}

const INITIAL_FORM: FormState = {
  address: '',
  dongInput: '',
  hoInput: '',
  isBasement: false,
  landArea: 0,
  buildingArea: 0,
  sellingPrice: 0,
  landUnitPrice: 0,
  buildingStandardValue: 0,
  structureId: 'cheolgeun',
  useCategory: '주거용',
  usageId: '1',
  completionYear: '',
}

export function VatCalculatorClient() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VatAllocationResult | null>(null)
  const [resultSellingPrice, setResultSellingPrice] = useState<number>(0)
  const [resetKey, setResetKey] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [pnu, setPnu] = useState<string>('')
  const captureRef = useRef<HTMLDivElement>(null)

  async function handleDownloadPng() {
    if (!captureRef.current) return
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const today = new Date().toISOString().slice(0, 10)
      const link = document.createElement('a')
      link.download = `부가가치세_계산_${today}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('[png-download]', e)
      alert(`PNG 다운로드 실패: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setDownloading(false)
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleAddressSelect(sel: AddressSelection) {
    setForm((prev) => ({
      ...prev,
      address: sel.roadAddress || sel.jibunAddress,
    }))
  }

  function handleAutoLookupDone(meta: AutoLookupMeta) {
    // [자동 조회] / [다시 조회] 누를 때마다 API 매핑 결과 항상 덮어쓰기.
    // 사용자가 수동으로 수정한 값을 유지하려면 [다시 조회]를 누르지 않으면 됨.
    setForm((prev) => {
      const next = { ...prev }
      let changed = false
      if (meta.completionYear) {
        next.completionYear = String(meta.completionYear)
        changed = true
      }
      if (meta.structureId) {
        next.structureId = meta.structureId
        changed = true
      }
      if (meta.usageId) {
        next.usageId = meta.usageId
        // 자동 매핑된 코드의 카테고리도 함께 갱신
        const use = getBuildingUseByCode(Number(meta.usageId))
        if (use) {
          next.useCategory = use.category
        }
        changed = true
      }
      return changed ? next : prev
    })
  }

  /** 카테고리 변경 시: 선택 코드를 새 카테고리의 첫 번째 용도로 초기화 */
  function handleCategoryChange(category: BuildingUseCategory) {
    setForm((prev) => {
      if (prev.useCategory === category) return prev
      // 주거용 → '1' (아파트), 상업용 → '3' (관광호텔 5/4성급, 시행령 첫 항목)
      const defaultCode = category === '주거용' ? '1' : '3'
      return { ...prev, useCategory: category, usageId: defaultCode }
    })
  }

  function handleReset() {
    if (!confirm('모든 입력값을 초기화하시겠습니까?')) return
    setForm(INITIAL_FORM)
    setError(null)
    setResult(null)
    setResultSellingPrice(0)
    setPnu('')
    setResetKey((k) => k + 1)
  }

  function handleCalculate() {
    const computed = calculateVatAllocation({
      sellingPrice: form.sellingPrice,
      landArea: form.landArea,
      landUnitPrice: form.landUnitPrice,
      buildingStandardValue: form.buildingStandardValue,
    })

    if (!computed) {
      setError(
        '매도예상가, 토지면적, 토지공시지가, 건물기준시가를 모두 0보다 큰 값으로 입력해주세요.',
      )
      setResult(null)
      return
    }

    setError(null)
    setResult(computed)
    setResultSellingPrice(form.sellingPrice)
  }

  return (
    <div className="space-y-5">
      <div ref={captureRef} className="space-y-5 bg-white">
        {result && (
          <div className="text-center pt-4 pb-2 space-y-2">
            <h2 className="text-lg font-bold text-gray-900">
              건물분 부가가치세 계산서
            </h2>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded inline-block">
              ⚠️ 자동계산 수치는 반드시 공시지가 조회 사이트, 건축물대장과
              비교하여 검증하시기 바랍니다.
            </p>
          </div>
        )}

        {/* 1. 기본 정보 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">📍 기본 정보</h2>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 inline-flex items-center gap-1 text-gray-600"
              title="모든 입력값 초기화"
            >
              <RotateCcw size={11} /> 초기화
            </button>
          </div>

          <Field label="물건 위치" required>
            <AddressSearchInput
              value={form.address}
              onChange={(v) => update('address', v)}
              onSelect={handleAddressSelect}
            />
          </Field>

          <Field label="상세 위치">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <input
                type="text"
                value={form.dongInput}
                onChange={(e) => update('dongInput', e.target.value)}
                placeholder="동"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                inputMode="numeric"
                value={form.hoInput}
                onChange={(e) => update('hoInput', e.target.value)}
                placeholder="호 (숫자)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
              />
              <label className="flex items-center gap-1.5 text-sm text-gray-700 whitespace-nowrap px-2 py-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isBasement}
                  onChange={(e) => update('isBasement', e.target.checked)}
                  className="rounded border-gray-300"
                />
                지하
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">단독주택의 경우 빈칸</p>
          </Field>

          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <Field label="토지 면적(㎡)" required>
                <AreaInput
                  value={form.landArea}
                  onChange={(v) => update('landArea', v)}
                  placeholder="예: 21.75"
                />
              </Field>
            </div>
            <div className="col-span-3">
              <BuildingAreaField
                key={resetKey}
                value={form.buildingArea}
                onChange={(v) => update('buildingArea', v)}
                pnu={pnu}
                dongInput={form.dongInput}
                hoInput={form.hoInput}
                isBasement={form.isBasement}
                onAutoLookupDone={handleAutoLookupDone}
              />
            </div>
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

        {/* 2. 건물 정보 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">🏗️ 건물 정보</h2>
          <p className="text-xs text-gray-500 -mt-2">
            기준시가 자동계산에 사용됩니다. 자동조회 시 신축연도가 자동으로
            채워집니다.
          </p>

          {/* 용도 1차 분기 (PR #97) — 주거용/상업용 풀폭 토글 */}
          <Field label="용도 구분" required>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('주거용')}
                className={
                  form.useCategory === '주거용'
                    ? 'flex-1 py-3 rounded-lg text-white font-bold text-base shadow-sm'
                    : 'flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 text-base hover:bg-gray-50'
                }
                style={
                  form.useCategory === '주거용'
                    ? { background: 'var(--brand-grad)' }
                    : undefined
                }
              >
                주거용
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('상업용')}
                className={
                  form.useCategory === '상업용'
                    ? 'flex-1 py-3 rounded-lg text-white font-bold text-base shadow-sm'
                    : 'flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 text-base hover:bg-gray-50'
                }
                style={
                  form.useCategory === '상업용'
                    ? { background: 'var(--brand-grad)' }
                    : undefined
                }
              >
                상업용
              </button>
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="구조" required>
              <select
                value={form.structureId}
                onChange={(e) => update('structureId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:border-indigo-500 focus:outline-none"
              >
                {STRUCTURES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="용도" required>
              <select
                value={form.usageId}
                onChange={(e) => update('usageId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base focus:border-indigo-500 focus:outline-none"
              >
                {Object.entries(
                  groupBuildingUsesBySubCategory(form.useCategory),
                )
                  .sort(
                    ([a], [b]) =>
                      SUB_CATEGORY_ORDER.indexOf(a as BuildingUseSubCategory) -
                      SUB_CATEGORY_ORDER.indexOf(b as BuildingUseSubCategory),
                  )
                  .map(([subCategory, uses]) => (
                    <optgroup key={subCategory} label={subCategory}>
                      {uses.map((use) => (
                        <option key={use.code} value={String(use.code)}>
                          {use.name} ({use.index})
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
            </Field>
            <Field label="신축연도" required>
              <input
                type="text"
                inputMode="numeric"
                value={form.completionYear}
                onChange={(e) => update('completionYear', e.target.value)}
                placeholder="2026"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-right tabular-nums text-base focus:border-indigo-500 focus:outline-none"
              />
            </Field>
          </div>
        </section>

        {/* 3. 조회 정보 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">💰 조회 정보</h2>

          <LandValueField
            key={resetKey}
            value={form.landUnitPrice}
            onChange={(v) => update('landUnitPrice', v)}
            address={form.address}
            onPnuResolved={setPnu}
          />

          <BuildingStandardValueField
            value={form.buildingStandardValue}
            onChange={(v) => update('buildingStandardValue', v)}
            buildingArea={form.buildingArea}
            landUnitPrice={form.landUnitPrice}
            structureId={form.structureId}
            usageId={form.usageId}
            completionYear={form.completionYear}
          />
        </section>

        {result && (
          <VatResultPanel result={result} sellingPrice={resultSellingPrice} />
        )}
      </div>
      {/* /captureRef */}

      {/* 액션 (캡처 영역 밖) — 초기화는 기본 정보 헤더로 이동 */}
      <button
        type="button"
        onClick={handleCalculate}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-medium shadow hover:shadow-md transition-shadow"
        style={{
          background: 'var(--brand-grad)',
        }}
      >
        <Calculator size={16} /> 부가가치세 계산하기
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PNG 다운로드 (캡처 영역 밖) */}
      {result && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center gap-1.5"
          >
            <Download size={14} />
            {downloading ? '생성 중...' : 'PNG 다운로드'}
          </button>
        </div>
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
