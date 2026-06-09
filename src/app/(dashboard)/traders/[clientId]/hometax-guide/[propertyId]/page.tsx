import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatNumberWithCommas } from '@/lib/utils/format-number'
import { HometaxGuidePrintButton } from '@/components/traders/HometaxGuidePrintButton'

export const metadata: Metadata = {
  title: '홈택스 입력 참고 — 토지등 매매차익 예정신고',
}

interface Props {
  params: Promise<{ clientId: string; propertyId: string }>
}

const TAX_AGENT_PHONE = '010-3137-9338'

function fmt(n: number | null | undefined): string {
  return formatNumberWithCommas(Number(n ?? 0)) || '0'
}

function fmtArea(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  if (!Number.isFinite(v) || v === 0) return '0'
  return v.toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/** 주민번호 표시: 6자리-7자리 (마스킹 없음, 입력 참고용) */
function fmtResidentNumber(raw: string | null | undefined): string {
  if (!raw) return '-'
  const digits = raw.replace(/-/g, '')
  if (digits.length === 13) return `${digits.slice(0, 6)}-${digits.slice(6)}`
  return raw
}

/** 사업자번호 표시: 3-2-5 */
function fmtBizNumber(raw: string | null | undefined): string {
  if (!raw) return '-'
  const digits = raw.replace(/-/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }
  return raw
}

export default async function HometaxGuidePage({ params }: Props) {
  const { clientId, propertyId } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: property }] = await Promise.all([
    supabase
      .from('clients')
      .select(
        'id, company_name, representative, business_number, resident_number, phone',
      )
      .eq('id', clientId)
      .single(),
    supabase
      .from('trader_properties')
      .select('*')
      .eq('id', propertyId)
      .eq('client_id', clientId)
      .single(),
  ])

  if (!client || !property) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href={`/traders/${clientId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={14} /> 매매사업자로 돌아가기
        </Link>
        <p className="mt-6 text-gray-600">물건을 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (property.tax_category === '양도소득세') {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href={`/traders/${clientId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={14} /> 매매사업자로 돌아가기
        </Link>
        <p className="mt-6 text-amber-700 bg-amber-50 border border-amber-200 rounded px-4 py-3">
          양도소득세 건은 토지등 매매차익 예정신고 대상이 아닙니다. 본
          참고화면은 매매사업자 건에만 제공됩니다.
        </p>
      </div>
    )
  }

  const acquisition = Number(property.acquisition_amount) || 0
  const otherExpenses = Number(property.other_expenses) || 0
  const transferAmount = Number(property.transfer_amount) || 0
  const vatAmount = Number(property.vat_amount) || 0
  // 양도차익(확인용) — CLAUDE.md 매매사업자 양도소득 계산식:
  //   (transfer_amount - vat_amount) - SUM(필요경비)
  const gainLoss = Math.max(
    0,
    transferAmount - vatAmount - acquisition - otherExpenses,
  )
  const landArea = Number(property.land_area) || 0
  const buildingArea = Number(property.building_area) || 0

  // 성함 — 개인 매매사업자는 대표자명, 없으면 상호로 폴백
  const fullName = client.representative || client.company_name

  return (
    <div className="p-6 max-w-3xl mx-auto print:p-4 print:max-w-none">
      <Link
        href={`/traders/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4 no-print"
      >
        <ArrowLeft size={14} /> 매매사업자로 돌아가기
      </Link>

      <header className="mb-5">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">홈택스 입력 참고</h1>
          <span className="text-xs text-gray-500">
            토지등 매매차익 예정신고
          </span>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-3 leading-relaxed">
          ⚠️ 본 화면은 <strong>읽기 전용 참고용</strong>입니다. 홈택스에 자동
          입력하지 않습니다. 직원이 홈택스 화면과 나란히 놓고 1페이지 → 2페이지
          순서대로 직접 입력합니다.
        </p>
      </header>

      {/* 식별 헤더 */}
      <div
        className="rounded-lg p-4 mb-6 text-white"
        style={{ background: 'var(--brand-grad)' }}
      >
        <div className="grid grid-cols-3 gap-3">
          <Identity label="거래처" value={client.company_name} />
          <Identity label="물건" value={property.property_name} />
          <Identity
            label="신고기한"
            value={property.filing_deadline ?? '-'}
          />
        </div>
      </div>

      {/* 🟦 1페이지 — 기본정보(납세자) */}
      <SectionHeader title="1페이지 · 기본정보(납세자)" tone="page1" />
      <FieldRow
        label="주민등록번호"
        value={fmtResidentNumber(client.resident_number)}
      />
      <FieldRow label="성함" value={fullName} />
      <FieldRow label="전화번호" value={client.phone ?? '-'} />
      <FieldRow label="세무대리인 전화번호" value={TAX_AGENT_PHONE} fixed />

      {/* 🟩 2페이지 — 토지등 매매차익 계산명세 */}
      <SectionHeader
        title="2페이지 · 토지등 매매차익 계산명세"
        tone="page2"
      />
      <FieldRow
        label="사업자등록번호"
        value={fmtBizNumber(client.business_number)}
      />
      <FieldRow
        label="세율구분"
        value="(기본세율) 2년이상 보유 토지ㆍ건물 등, 국외자산, 기타자산 (10)"
        fixed
      />
      <FieldRow label="자산종류" value="일반주택 (3)" fixed />
      <FieldRow
        label="부동산소재지"
        value={property.location ?? '-'}
        note="※ 홈택스에서는 [주소검색] 버튼으로 입력하세요"
      />
      <FieldRow label="양도일" value={property.transfer_date ?? '-'} />
      <FieldRow label="양도면적(토지)" value={`${fmtArea(landArea)} m²`} />
      <FieldRow label="양도면적(건물)" value={`${fmtArea(buildingArea)} m²`} />
      <FieldRow label="양도가액" value={`${fmt(transferAmount)} 원`} />
      <FieldRow label="취득가액" value={`${fmt(acquisition)} 원`} />
      <FieldRow label="양도비" value={`${fmt(otherExpenses)} 원`} />
      <FieldRow
        label="양도차익"
        value={`${fmt(gainLoss)} 원`}
        check
        note="확인용 — 홈택스가 양도가액·취득가액·양도비 등으로 자동 산출"
      />

      <div className="mt-6 flex justify-end gap-2 no-print">
        <HometaxGuidePrintButton />
      </div>

      <footer className="mt-6 text-xs text-gray-500 border-t pt-4">
        본 자료는 직원이 홈택스 입력 시 참고용으로만 사용됩니다. 실제 신고 전
        항목별로 한 번 더 확인해 주세요.
      </footer>
    </div>
  )
}

function Identity({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-white/80 tracking-wider font-bold">
        {label}
      </div>
      <div className="font-semibold truncate text-sm mt-0.5">{value}</div>
    </div>
  )
}

function SectionHeader({
  title,
  tone,
}: {
  title: string
  tone: 'page1' | 'page2'
}) {
  const styles =
    tone === 'page1'
      ? 'text-blue-700 border-blue-500 bg-blue-50'
      : 'text-emerald-700 border-emerald-500 bg-emerald-50'
  return (
    <h2
      className={`text-sm font-bold mt-6 mb-0 px-3 py-2 rounded-t border-b-2 ${styles}`}
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {title}
    </h2>
  )
}

function FieldRow({
  label,
  value,
  fixed,
  check,
  note,
}: {
  label: string
  value: string
  fixed?: boolean
  check?: boolean
  note?: string
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 px-3 py-2.5 border-b border-gray-200 items-start">
      <div className="text-sm text-gray-700 font-medium">{label}</div>
      <div className="text-sm">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`tabular-nums ${
              check ? 'text-gray-500' : 'text-gray-900 font-semibold'
            }`}
          >
            {value}
          </span>
          {fixed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
              고정값
            </span>
          )}
          {check && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              확인용 (자동산출)
            </span>
          )}
        </div>
        {note && <div className="text-[11px] text-amber-700 mt-1">{note}</div>}
      </div>
    </div>
  )
}
