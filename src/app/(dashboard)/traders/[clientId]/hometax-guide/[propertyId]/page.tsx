import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatNumberWithCommas } from '@/lib/utils/format-number'

export const metadata: Metadata = {
  title: '홈택스 입력 참고 — 토지등 매매차익 예정신고',
}

interface Props {
  params: Promise<{ clientId: string; propertyId: string }>
}

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

export default async function HometaxGuidePage({ params }: Props) {
  const { clientId, propertyId } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: property }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, company_name, business_number')
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
  const expensesTotal = acquisition + otherExpenses
  const transferAmount = Number(property.transfer_amount) || 0
  // 19. 매매차익 = 11 - 17 - 18 (홈택스 표 그대로; 18=0)
  const gainLoss = transferAmount - expensesTotal
  const landArea = Number(property.land_area) || 0
  const buildingArea = Number(property.building_area) || 0

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href={`/traders/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4"
      >
        <ArrowLeft size={14} /> 매매사업자로 돌아가기
      </Link>

      <header className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          홈택스 입력 참고 — 토지등 매매차익 예정신고
        </h1>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-2 inline-block">
          ⚠️ 본 화면은 읽기 전용 참고용입니다. 홈택스에 자동 입력하지 않습니다.
          항목 순서대로 직접 입력해 주세요.
        </p>
      </header>

      {/* 식별 헤더 — Commit 3에서 강조 */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50 text-sm">
        <div className="grid grid-cols-3 gap-3">
          <Identity label="거래처" value={client.company_name} />
          <Identity label="물건" value={property.property_name} />
          <Identity label="신고기한" value={property.filing_deadline ?? '-'} />
        </div>
      </div>

      <SectionHeader title="A. 양도자산명세 정보" />
      <FieldRow
        no="6"
        label="세율구분"
        value="(기본세율) 2년이상 보유 토지ㆍ건물 등, 국외자산, 기타자산 (10)"
        fixed
      />
      <FieldRow no="7" label="자산종류" value="일반주택 (3)" fixed />
      <FieldRow
        no="8"
        label="부동산소재지"
        value={property.location ?? '-'}
        note="※ 홈택스에서는 [주소검색] 버튼으로 입력하세요"
      />

      <SectionHeader title="B. 매매가액 계산" />
      <FieldRow
        no="9"
        label="양도일"
        value={property.transfer_date ?? '-'}
      />
      <FieldRow
        no="10"
        label="양도면적(㎡)"
        value={
          landArea > 0 || buildingArea > 0
            ? `토지 ${fmtArea(landArea)} + 건물 ${fmtArea(buildingArea)} = ${fmtArea(landArea + buildingArea)}`
            : '0'
        }
      />
      <FieldRow no="11" label="매매가액" value={`${fmt(transferAmount)} 원`} />

      <SectionHeader title="C. 매매차익 계산 (필요경비)" />
      <FieldRow no="12" label="취득가액" value={`${fmt(acquisition)} 원`} />
      <FieldRow no="13" label="자본적지출액" value="0 원" fixed />
      <FieldRow no="14" label="양도비" value={`${fmt(otherExpenses)} 원`} />
      <FieldRow no="15" label="건설자금충당이자" value="0 원" fixed />
      <FieldRow no="16" label="공과금" value="0 원" fixed />
      <FieldRow
        no="17"
        label="필요경비 계 (12+~+16)"
        value={`${fmt(expensesTotal)} 원`}
        auto
      />
      <FieldRow no="18" label="장기보유특별공제" value="0 원" fixed />
      <FieldRow
        no="19"
        label="매매차익 (11-17-18)"
        value={`${fmt(gainLoss)} 원`}
        auto
        highlight
      />

      <footer className="mt-8 text-xs text-gray-500 border-t pt-4">
        본 자료는 직원이 홈택스 입력 시 참고용으로만 사용됩니다.
        실제 신고 전 항목별로 한번 더 확인해 주세요.
      </footer>
    </div>
  )
}

function Identity({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900 truncate">{value}</div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      className="text-sm font-bold mt-6 mb-2 px-3 py-2 rounded text-white"
      style={{ background: 'var(--brand-grad)' }}
    >
      {title}
    </h2>
  )
}

function FieldRow({
  no,
  label,
  value,
  fixed,
  auto,
  highlight,
  note,
}: {
  no: string
  label: string
  value: string
  fixed?: boolean
  auto?: boolean
  highlight?: boolean
  note?: string
}) {
  return (
    <div
      className={`grid grid-cols-[40px_180px_1fr] gap-3 px-3 py-2.5 border-b border-gray-200 items-start ${
        highlight ? 'bg-purple-50' : ''
      }`}
    >
      <div className="text-xs text-gray-400 tabular-nums pt-0.5">{no}</div>
      <div className="text-sm text-gray-700 font-medium">{label}</div>
      <div className="text-sm">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`tabular-nums ${
              highlight
                ? 'font-bold text-brand text-base'
                : auto
                  ? 'text-gray-500'
                  : 'text-gray-900 font-semibold'
            }`}
          >
            {value}
          </span>
          {fixed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
              고정값
            </span>
          )}
          {auto && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              홈택스 자동계산
            </span>
          )}
        </div>
        {note && (
          <div className="text-[11px] text-amber-700 mt-1">{note}</div>
        )}
      </div>
    </div>
  )
}
