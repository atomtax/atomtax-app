'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  ChevronUp,
  Calculator,
  FileSearch,
  FileText,
  FolderOpen,
  Receipt,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import {
  calculatePropertyTax,
  clearPriorPrepaidOverride,
  deleteProperty,
  getExpenses,
  saveExpensesAndProperty,
  updatePriorPrepaidOverride,
  updatePriorTransferIncomeOverride,
  type PriorAmounts,
} from '@/app/actions/trader-properties'
import { EXPENSE_NAMES } from '@/lib/constants/property-expense'
import { PROGRESS_OPTIONS, PROGRESS_STYLES } from '@/lib/constants/property-progress'
import {
  formatNumberWithCommas,
  parseNumberFromCommas,
} from '@/lib/utils/format-number'
import {
  PROPERTY_TYPE_OPTIONS,
  TRADER_EXPENSE_CATEGORY_OPTIONS,
  type TraderExpenseCategory,
  type TraderProperty,
  type TraderPropertyExpense,
} from '@/types/database'

// 모달은 클릭 시에만 로드
const PropertyReferenceModal = dynamic(
  () => import('./PropertyReferenceModal').then((m) => m.PropertyReferenceModal),
  { ssr: false },
)
const PropertyReportModal = dynamic(
  () => import('./PropertyReportModal').then((m) => m.PropertyReportModal),
  { ssr: false },
)

interface Props {
  property: TraderProperty
  clientName: string
  clientFolder: string | null
  onChange: (updates: Partial<TraderProperty>) => void
  onCollapse: () => void
}

export function PropertyDetailPanel({
  property,
  clientName,
  clientFolder,
  onChange,
  onCollapse,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [propertyName, setPropertyName] = useState(property.property_name)
  const [expenses, setExpenses] = useState<TraderPropertyExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showReference, setShowReference] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [prior, setPrior] = useState<PriorAmounts | null>(null)
  const [priorInput, setPriorInput] = useState<string>('')
  const [priorPrepaidIncomeInput, setPriorPrepaidIncomeInput] = useState<string>('')
  const [priorPrepaidLocalInput, setPriorPrepaidLocalInput] = useState<string>('')

  // 펼침 시 필요경비 로드
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getExpenses(property.id)
      .then((data) => {
        if (!cancelled) {
          setExpenses(data)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          alert(`필요경비 로드 실패: ${e instanceof Error ? e.message : String(e)}`)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [property.id])

  // 외부에서 property_name 변경 시 입력 칸 동기화
  useEffect(() => {
    setPropertyName(property.property_name)
  }, [property.property_name])

  // 페이지 진입 시 server 호출 없이 override 값만으로 stub 구성.
  // 자동계산은 [세금계산] 버튼 클릭 시에만 명시적으로 수행.
  useEffect(() => {
    const incomeOverride = property.prior_transfer_income_override
    const prepaidIncomeOverride = property.prior_prepaid_income_tax_override
    const prepaidLocalOverride = property.prior_prepaid_local_tax_override

    setPrior({
      priorTransferIncome: 0,
      priorPrepaidIncomeTax: 0,
      priorPrepaidLocalTax: 0,
      priorPropertiesCount: 0,
      priorPropertyNames: [],
      effectivePriorTransferIncome: incomeOverride ?? 0,
      effectivePriorPrepaidIncomeTax: prepaidIncomeOverride ?? 0,
      effectivePriorPrepaidLocalTax: prepaidLocalOverride ?? 0,
      isOverridden: incomeOverride !== null,
      isPrepaidIncomeOverridden: prepaidIncomeOverride !== null,
      isPrepaidLocalOverridden: prepaidLocalOverride !== null,
    })
    setPriorInput(
      incomeOverride !== null ? formatNumberWithCommas(incomeOverride) : '',
    )
    setPriorPrepaidIncomeInput(
      prepaidIncomeOverride !== null ? formatNumberWithCommas(prepaidIncomeOverride) : '',
    )
    setPriorPrepaidLocalInput(
      prepaidLocalOverride !== null ? formatNumberWithCommas(prepaidLocalOverride) : '',
    )
  }, [
    property.id,
    property.prior_transfer_income_override,
    property.prior_prepaid_income_tax_override,
    property.prior_prepaid_local_tax_override,
  ])

  function updateExpense(index: number, updates: Partial<TraderPropertyExpense>) {
    setExpenses((prev) => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  function clearExpense(index: number) {
    setExpenses((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              expense_name: null,
              category: '취득가액',
              amount: 0,
              predeclaration_allowed: true,
              income_tax_allowed: true,
              memo: null,
            }
          : r,
      ),
    )
  }

  function handleSaveAll() {
    startTransition(async () => {
      try {
        await saveExpensesAndProperty(
          property.id,
          {
            property_name: propertyName,
            property_type: property.property_type ?? null,
            location: property.location,
            prepaid_income_tax: Number(property.prepaid_income_tax) || 0,
            prepaid_local_tax: Number(property.prepaid_local_tax) || 0,
            is_85_over: property.is_85_over,
            comparison_taxation: property.comparison_taxation,
            progress_status: property.progress_status,
            transfer_amount: Number(property.transfer_amount) || 0,
            vat_amount: Number(property.vat_amount) || 0,
            acquisition_date: property.acquisition_date,
            transfer_date: property.transfer_date,
            land_area: Number(property.land_area) || 0,
            building_area: Number(property.building_area) || 0,
          },
          expenses.map((r) => ({
            row_no: r.row_no,
            expense_name: r.expense_name,
            category: r.category,
            amount: Number(r.amount) || 0,
            predeclaration_allowed: r.predeclaration_allowed,
            income_tax_allowed: r.income_tax_allowed,
            memo: r.memo,
          })),
        )
        alert('저장 및 반영되었습니다.')
        router.refresh()
      } catch (e) {
        alert(`저장 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  function handleDelete() {
    if (!confirm(`"${property.property_name}" 물건을 삭제하시겠습니까?`)) return
    startTransition(async () => {
      try {
        await deleteProperty(property.id)
        router.refresh()
      } catch (e) {
        alert(`삭제 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  async function handleCalculateTax() {
    try {
      // 1) 현재 클라이언트 state(부가세, 필요경비 등)를 먼저 DB에 반영.
      //    저장하지 않으면 calculatePropertyTax가 stale한 transfer_income을 읽어
      //    부가세 차감이 산출세액에 반영되지 않는다.
      await saveExpensesAndProperty(
        property.id,
        {
          property_name: propertyName,
          property_type: property.property_type ?? null,
          location: property.location,
          prepaid_income_tax: Number(property.prepaid_income_tax) || 0,
          prepaid_local_tax: Number(property.prepaid_local_tax) || 0,
          is_85_over: property.is_85_over,
          comparison_taxation: property.comparison_taxation,
          progress_status: property.progress_status,
          transfer_amount: Number(property.transfer_amount) || 0,
          vat_amount: Number(property.vat_amount) || 0,
          acquisition_date: property.acquisition_date,
          transfer_date: property.transfer_date,
          land_area: Number(property.land_area) || 0,
          building_area: Number(property.building_area) || 0,
        },
        expenses.map((r) => ({
          row_no: r.row_no,
          expense_name: r.expense_name,
          category: r.category,
          amount: Number(r.amount) || 0,
          predeclaration_allowed: r.predeclaration_allowed,
          income_tax_allowed: r.income_tax_allowed,
          memo: r.memo,
        })),
      )

      // 2) 갱신된 transfer_income 기준으로 산출세액 계산
      const result = await calculatePropertyTax(property.id)
      onChange({
        prepaid_income_tax: result.income_tax,
        prepaid_local_tax: result.local_tax,
      })
      setPrior(result.prior)
      setPriorInput(formatNumberWithCommas(result.prior.effectivePriorTransferIncome))
      setPriorPrepaidIncomeInput(
        formatNumberWithCommas(result.prior.effectivePriorPrepaidIncomeTax),
      )
      setPriorPrepaidLocalInput(
        formatNumberWithCommas(result.prior.effectivePriorPrepaidLocalTax),
      )
    } catch (e) {
      alert(`세금 계산 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handlePriorSave() {
    const numeric = parseNumberFromCommas(priorInput)
    // 자동값과 같으면 override 해제(null), 다르면 override 저장.
    // 자동값이 아직 로드되지 않았다면(=0) 입력값을 그대로 override로 저장.
    const newValue =
      prior && prior.priorTransferIncome > 0 && numeric === prior.priorTransferIncome
        ? null
        : numeric
    try {
      await updatePriorTransferIncomeOverride(property.id, newValue)
      // property prop의 prior_transfer_income_override 갱신은 router.refresh로 처리
      router.refresh()
    } catch (e) {
      alert(`종전 양도차익 저장 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handlePriorReset() {
    try {
      await updatePriorTransferIncomeOverride(property.id, null)
      router.refresh()
    } catch (e) {
      alert(`자동값 복귀 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handlePriorPrepaidIncomeSave() {
    const numeric = parseNumberFromCommas(priorPrepaidIncomeInput)
    const newValue =
      prior && prior.priorPrepaidIncomeTax > 0 && numeric === prior.priorPrepaidIncomeTax
        ? null
        : numeric
    try {
      await updatePriorPrepaidOverride(property.id, 'income_tax', newValue)
      router.refresh()
    } catch (e) {
      alert(`종전 기납부 종소세 저장 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handlePriorPrepaidIncomeReset() {
    try {
      await clearPriorPrepaidOverride(property.id, 'income_tax')
      router.refresh()
    } catch (e) {
      alert(`자동값 복귀 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handlePriorPrepaidLocalSave() {
    const numeric = parseNumberFromCommas(priorPrepaidLocalInput)
    const newValue =
      prior && prior.priorPrepaidLocalTax > 0 && numeric === prior.priorPrepaidLocalTax
        ? null
        : numeric
    try {
      await updatePriorPrepaidOverride(property.id, 'local_tax', newValue)
      router.refresh()
    } catch (e) {
      alert(`종전 기납부 지방소득세 저장 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  async function handlePriorPrepaidLocalReset() {
    try {
      await clearPriorPrepaidOverride(property.id, 'local_tax')
      router.refresh()
    } catch (e) {
      alert(`자동값 복귀 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  function handleOpenFolder() {
    if (!clientFolder) {
      alert(
        '이 고객사에는 부동산 폴더 URL이 등록되어 있지 않습니다. 고객 정보에서 먼저 등록해주세요.',
      )
      return
    }
    window.open(clientFolder, '_blank', 'noopener,noreferrer')
  }

  const acquisitionTotal = useMemo(
    () =>
      expenses
        .filter((r) => r.predeclaration_allowed && r.category === '취득가액')
        .reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [expenses],
  )

  const otherExpensesTotal = useMemo(
    () =>
      expenses
        .filter((r) => r.predeclaration_allowed && r.category === '기타필요경비')
        .reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [expenses],
  )

  // 합계가 변하면 부모 폼 state를 즉시 갱신 — 메인 행의 취득가액/기타필요경비/양도소득이
  // 저장 전에도 화면에 반영되도록. 로딩 중에는 무시 (초기 0이 DB값을 덮어쓰는 것 방지).
  useEffect(() => {
    if (loading) return
    if (
      Number(property.acquisition_amount) !== acquisitionTotal ||
      Number(property.other_expenses) !== otherExpensesTotal
    ) {
      onChange({
        acquisition_amount: acquisitionTotal,
        other_expenses: otherExpensesTotal,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acquisitionTotal, otherExpensesTotal, loading])

  const progressStyle = PROGRESS_STYLES[property.progress_status]

  return (
    <div className="px-4 py-4 border-l-4 border-indigo-400">
      {/* 헤더: 물건명 + 종류 + 진행단계 + 접기 */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <label className="text-sm font-bold text-gray-700">물건명</label>
          <input
            type="text"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="물건명 입력"
            className="flex-1 max-w-xs px-3 py-1.5 border border-gray-300 rounded text-sm focus:border-indigo-500 focus:outline-none"
          />
          <label className="text-xs font-medium text-gray-600">종류</label>
          <select
            value={property.property_type ?? ''}
            onChange={(e) => onChange({ property_type: e.target.value || null })}
            className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">선택</option>
            {PROPERTY_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <label className="text-xs font-medium text-gray-600">진행단계</label>
          <select
            value={property.progress_status}
            onChange={(e) =>
              onChange({
                progress_status: e.target.value as TraderProperty['progress_status'],
              })
            }
            className={`px-3 py-1.5 border rounded text-sm focus:border-indigo-500 focus:outline-none ${progressStyle.bg} ${progressStyle.text} ${progressStyle.border}`}
          >
            {PROGRESS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-gray-100"
          title="접기"
        >
          <ChevronUp size={14} /> 접기
        </button>
      </div>

      {/* 메타 정보 그리드 */}
      <div className="grid grid-cols-6 gap-3 mb-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">소재지</label>
          <input
            type="text"
            value={property.location ?? ''}
            onChange={(e) => onChange({ location: e.target.value || null })}
            placeholder="소재지"
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">기납부 종소세</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatNumberWithCommas(property.prepaid_income_tax)}
            onChange={(e) =>
              onChange({ prepaid_income_tax: parseNumberFromCommas(e.target.value) })
            }
            placeholder="0"
            className="w-full px-2 py-1 text-right border border-gray-200 rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">기납부 지방소득세</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatNumberWithCommas(property.prepaid_local_tax)}
            onChange={(e) =>
              onChange({ prepaid_local_tax: parseNumberFromCommas(e.target.value) })
            }
            placeholder="0"
            className="w-full px-2 py-1 text-right border border-gray-200 rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">85㎡ 초과</label>
          <select
            value={property.is_85_over ? 'Y' : 'N'}
            onChange={(e) => onChange({ is_85_over: e.target.value === 'Y' })}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="N">N</option>
            <option value="Y">Y</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">비교과세</label>
          <select
            value={property.comparison_taxation ? 'Y' : 'N'}
            onChange={(e) =>
              onChange({ comparison_taxation: e.target.value === 'Y' })
            }
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="N">N</option>
            <option value="Y">Y</option>
          </select>
        </div>

        {/* 종전 양도차익 (수동 수정 가능, 🔄 자동값 복귀) */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
            <span>종전 양도차익 (동일년도)</span>
            {prior?.isOverridden && (
              <button
                type="button"
                onClick={handlePriorReset}
                title="자동계산값으로 복귀"
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                <RotateCcw size={9} />
                자동
              </button>
            )}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={priorInput}
            onChange={(e) =>
              setPriorInput(formatNumberWithCommas(parseNumberFromCommas(e.target.value)))
            }
            onBlur={handlePriorSave}
            placeholder="0"
            className={`w-full px-2 py-1 text-right border rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none ${
              prior?.isOverridden
                ? 'bg-yellow-50 border-yellow-300'
                : 'border-gray-200'
            }`}
          />
          {prior && prior.priorPropertiesCount > 0 && (
            <p className="text-[10px] text-gray-500 mt-0.5 truncate" title={prior.priorPropertyNames.join(', ')}>
              합산 {prior.priorPropertiesCount}건: {prior.priorPropertyNames.join(', ')}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
            <span>종전 기납부 종소세</span>
            {prior?.isPrepaidIncomeOverridden && (
              <button
                type="button"
                onClick={handlePriorPrepaidIncomeReset}
                title="자동계산값으로 복귀"
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                <RotateCcw size={9} />
                자동
              </button>
            )}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={priorPrepaidIncomeInput}
            onChange={(e) =>
              setPriorPrepaidIncomeInput(
                formatNumberWithCommas(parseNumberFromCommas(e.target.value)),
              )
            }
            onBlur={handlePriorPrepaidIncomeSave}
            placeholder="0"
            className={`w-full px-2 py-1 text-right border rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none ${
              prior?.isPrepaidIncomeOverridden
                ? 'bg-yellow-50 border-yellow-300'
                : 'border-gray-200'
            }`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
            <span>종전 기납부 지방소득세</span>
            {prior?.isPrepaidLocalOverridden && (
              <button
                type="button"
                onClick={handlePriorPrepaidLocalReset}
                title="자동계산값으로 복귀"
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                <RotateCcw size={9} />
                자동
              </button>
            )}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={priorPrepaidLocalInput}
            onChange={(e) =>
              setPriorPrepaidLocalInput(
                formatNumberWithCommas(parseNumberFromCommas(e.target.value)),
              )
            }
            onBlur={handlePriorPrepaidLocalSave}
            placeholder="0"
            className={`w-full px-2 py-1 text-right border rounded text-sm tabular-nums focus:border-indigo-500 focus:outline-none ${
              prior?.isPrepaidLocalOverridden
                ? 'bg-yellow-50 border-yellow-300'
                : 'border-gray-200'
            }`}
          />
        </div>
      </div>

      {/* 토지/건물면적 + 부가세 + 차감 후 양도가액 + 액션 버튼 */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                토지면적
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(property.land_area)}
                onChange={(e) =>
                  onChange({ land_area: parseNumberFromCommas(e.target.value) })
                }
                placeholder="0"
                className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-gray-500">m²</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                건물면적
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(property.building_area)}
                onChange={(e) =>
                  onChange({ building_area: parseNumberFromCommas(e.target.value) })
                }
                placeholder="0"
                className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-gray-500">m²</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                부가세
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumberWithCommas(property.vat_amount)}
                onChange={(e) =>
                  onChange({ vat_amount: parseNumberFromCommas(e.target.value) })
                }
                placeholder="0"
                className="w-28 px-2 py-1 border border-gray-200 rounded text-sm text-right tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-gray-500">원</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                차감 후 양도가액
              </label>
              <div className="w-32 px-2 py-1 border border-gray-200 bg-blue-50 text-blue-900 rounded text-sm text-right tabular-nums">
                {formatNumberWithCommas(
                  Math.max(0, (Number(property.transfer_amount) || 0) - (Number(property.vat_amount) || 0)),
                ) || '0'}
              </div>
              <span className="text-xs text-gray-500">원</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 items-end">
            {/* 1행: 부동산 폴더 | 입력참고용 | 세금계산 */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleOpenFolder}
                disabled={!clientFolder}
                title={
                  clientFolder
                    ? '부동산 폴더 새 탭으로 열기'
                    : '고객 정보에 부동산 폴더 URL을 먼저 등록하세요'
                }
                className="px-3 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FolderOpen size={11} /> 부동산 폴더
              </button>
              <button
                type="button"
                onClick={() => setShowReference(true)}
                className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs rounded flex items-center gap-1"
              >
                <FileSearch size={11} /> 입력참고용
              </button>
              <button
                type="button"
                onClick={handleCalculateTax}
                className="px-3 py-1 bg-purple-600 text-white hover:bg-purple-700 text-xs rounded flex items-center gap-1"
              >
                <Calculator size={11} /> 세금계산
              </button>
            </div>

            {/* 2행: 부가세 계산기 | 고객 보고서 | 삭제 */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  window.open('/calculator/vat/calc', '_blank', 'noopener,noreferrer')
                }
                title="부가세 계산기를 새 탭에서 열기"
                className="px-3 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300 text-xs rounded flex items-center gap-1"
              >
                <Receipt size={11} /> 부가세 계산기
              </button>
              <button
                type="button"
                onClick={() => setShowReport(true)}
                className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs rounded flex items-center gap-1"
              >
                <FileText size={11} /> 고객 보고서
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs rounded flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 size={11} /> 삭제
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 필요경비 상세 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-700">📋 필요경비 상세</h3>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
          >
            <Save size={12} />
            {isPending ? '저장 중...' : '저장'}
          </button>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm bg-white border border-gray-200 rounded">
            필요경비 상세 로드 중...
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 rounded">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600 w-8">no</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-600">비용명</th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-600">구분</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-600 w-24">금액</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600 w-16">
                    예정
                    <br />
                    신고
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-600 w-16">
                    종소세
                    <br />
                    인정
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-gray-600">비고</th>
                  <th className="px-2 py-2 text-center w-12 font-semibold text-gray-600">삭제</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((row, idx) => (
                  <tr
                    key={`${row.row_no}-${idx}`}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-2 py-1 text-center text-gray-500">{row.row_no}</td>
                    <td className="px-2 py-1">
                      <select
                        value={row.expense_name ?? ''}
                        onChange={(e) =>
                          updateExpense(idx, { expense_name: e.target.value || null })
                        }
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">선택</option>
                        {EXPENSE_NAMES.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.category}
                        onChange={(e) =>
                          updateExpense(idx, {
                            category: e.target.value as TraderExpenseCategory,
                          })
                        }
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        {TRADER_EXPENSE_CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithCommas(row.amount)}
                        onChange={(e) =>
                          updateExpense(idx, {
                            amount: parseNumberFromCommas(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="w-full px-1 py-0.5 text-right border border-gray-200 rounded tabular-nums text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <select
                        value={row.predeclaration_allowed ? 'O' : 'X'}
                        onChange={(e) =>
                          updateExpense(idx, {
                            predeclaration_allowed: e.target.value === 'O',
                          })
                        }
                        className="px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="O">O</option>
                        <option value="X">X</option>
                      </select>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <select
                        value={row.income_tax_allowed ? 'O' : 'X'}
                        onChange={(e) =>
                          updateExpense(idx, { income_tax_allowed: e.target.value === 'O' })
                        }
                        className="px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="O">O</option>
                        <option value="X">X</option>
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={row.memo ?? ''}
                        onChange={(e) =>
                          updateExpense(idx, { memo: e.target.value || null })
                        }
                        placeholder="비고"
                        className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => clearExpense(idx)}
                        className="text-gray-400 hover:text-red-600 px-1"
                        title="행 비우기"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-indigo-50 border-t border-indigo-200 font-semibold">
                <tr>
                  <td colSpan={3} className="px-2 py-2 text-right text-gray-700">
                    취득가액 합계:
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-indigo-700">
                    {acquisitionTotal.toLocaleString('ko-KR')} 원
                  </td>
                  <td colSpan={4}></td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-2 py-2 text-right text-gray-700">
                    기타필요경비 합계:
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-indigo-700">
                    {otherExpensesTotal.toLocaleString('ko-KR')} 원
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        💡 예정신고 비용인정이 <strong>O</strong>인 항목만 합계에 포함됩니다.
        입력 즉시 메인 표의 취득가액·기타필요경비·양도소득이 갱신되며,
        [저장] 버튼을 눌러 DB에 반영하세요.
      </p>

      {showReference && (
        <PropertyReferenceModal
          property={property}
          onClose={() => setShowReference(false)}
        />
      )}
      {showReport && (
        <PropertyReportModal
          property={property}
          clientName={clientName}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
