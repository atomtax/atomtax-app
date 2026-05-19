/**
 * 부가가치세 계산 결과 보고서 (A4 1페이지) — PNG/PDF 출력 전용 (PR #112).
 *
 * 화면 캡처 방식의 input/placeholder 함정을 회피하기 위한 별도 컴포넌트.
 * 정적 텍스트 요소만 사용 (input/select 없음).
 *
 * 화면에 보이지 않고 PNG 다운로드 함수가 호출될 때만 렌더된 ref를 캡처.
 */

import { STRUCTURES } from '@/lib/calculators/building-standard-data'
import { getBuildingUseByCode } from '@/lib/data/building-use-codes'
import AtomLogo from '@/components/ui/AtomLogo'

export interface VatCalcReportData {
  // 입력값
  address: string
  dongInput: string
  hoInput: string
  isBasement: boolean
  landArea: number
  buildingArea: number
  sellingPrice: number

  // 건물 정보
  useCategory: '주거용' | '상업용'
  structureId: string
  usageId: string
  completionYear: string

  // 조회 정보
  landUnitPrice: number
  buildingStandardValue: number

  // 자동조회/계산 부가 정보
  autoLookupInfo?: string | null
  calcFormula?: string | null

  // 계산 결과
  vatMarket: number
  vatLow: number
  allocatedLand: number
  allocatedBuilding: number
  verifyTotal: number
  isValid: boolean
}

interface Props {
  data: VatCalcReportData
}

function fmt(n: number): string {
  return Number(n || 0).toLocaleString('ko-KR')
}

function fmtArea(n: number): string {
  return Number(n || 0).toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })
}

function todayLabel(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const COLORS = {
  brand: '#6927FF',
  brandDark: '#5118e0',
  text: '#111111',
  textSecondary: '#555555',
  textMuted: '#888888',
  border: '#e5e7eb',
  bgSection: '#f9fafb',
  bgHighlight: '#f4efff',
}

export function VatCalcReport({ data }: Props) {
  const structure = STRUCTURES.find((s) => s.id === data.structureId)
  const usage = getBuildingUseByCode(Number(data.usageId))
  const builtYear = parseInt(data.completionYear, 10)
  const yearsElapsed = Number.isFinite(builtYear)
    ? Math.max(0, 2025 - builtYear)
    : null

  const dongHo =
    data.dongInput || data.hoInput
      ? `${data.dongInput || '-'} / ${data.hoInput || '-'}${
          data.isBasement ? ' (지하)' : ''
        }`
      : '-'

  return (
    <div
      style={{
        width: '800px',
        minHeight: '1131px',
        background: '#ffffff',
        color: COLORS.text,
        fontFamily:
          "'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif",
        fontSize: '13px',
        lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
    >
      {/* 헤더 — Atom-base 보라 그라디언트 */}
      <div
        style={{
          padding: '24px 40px',
          background:
            'linear-gradient(135deg, #6927FF 0%, #9333ea 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AtomLogo size={36} style={{ color: '#ffffff' }} />
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              ATOM BASE
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
              아톰세무회계
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>
            건물분 부가가치세 계산서
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>
            발급일: {todayLabel()}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div style={{ padding: '32px 40px' }}>
        <Section title="기본 정보">
          <Row label="주소" value={data.address || '-'} />
          <Row label="동/호" value={dongHo} />
          <Row label="토지 면적" value={`${fmtArea(data.landArea)} m²`} />
          <Row
            label="건물 면적"
            value={`${fmtArea(data.buildingArea)} m²`}
            sub={data.autoLookupInfo ?? undefined}
          />
          <Row
            label="매도예상가"
            value={`${fmt(data.sellingPrice)} 원`}
            emphasize
          />
        </Section>

        <Section title="건물 정보">
          <Row label="용도 구분" value={data.useCategory} />
          <Row
            label="구조"
            value={
              structure
                ? `${structure.name} — ${structure.index}`
                : data.structureId || '-'
            }
          />
          <Row
            label="용도"
            value={
              usage ? `${usage.name} — ${usage.index}` : `code ${data.usageId}`
            }
            sub={usage?.description}
          />
          <Row
            label="신축연도"
            value={
              Number.isFinite(builtYear)
                ? `${builtYear}년${
                    yearsElapsed !== null ? ` (경과 ${yearsElapsed}년)` : ''
                  }`
                : '-'
            }
          />
        </Section>

        <Section title="조회 정보">
          <Row
            label="토지 공시지가"
            value={`${fmt(data.landUnitPrice)} 원/m²`}
          />
          <Row
            label="건물 기준시가"
            value={`${fmt(data.buildingStandardValue)} 원`}
            sub={data.calcFormula ?? undefined}
          />
        </Section>

        {/* 계산 결과 — 강조 박스 */}
        <div
          style={{
            marginTop: '24px',
            padding: '20px 24px',
            background: COLORS.bgHighlight,
            border: `2px solid ${COLORS.brand}`,
            borderRadius: '10px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: COLORS.brand,
              marginBottom: '14px',
              letterSpacing: '0.02em',
            }}
          >
            ▣ 계산 결과
          </div>

          <ResultRow
            label="부가가치세 시가 (정상가)"
            value={`${fmt(Math.round(data.vatMarket))} 원`}
          />
          <ResultRow
            label="부가가치세 최저가 (70% 만단위 올림)"
            value={`${fmt(data.vatLow)} 원`}
            highlight
          />

          <div
            style={{
              height: '1px',
              background: COLORS.brand,
              opacity: 0.2,
              margin: '14px 0',
            }}
          />

          <ResultRow
            label="토지가액 (안분 후)"
            value={`${fmt(data.allocatedLand)} 원`}
          />
          <ResultRow
            label="건물가액 (안분 후)"
            value={`${fmt(data.allocatedBuilding)} 원`}
          />
          <ResultRow
            label="합계 검증"
            value={`${fmt(data.verifyTotal)} 원 ${data.isValid ? '✓' : '⚠'}`}
            secondary
          />
        </div>

        {/* 안내 */}
        <div
          style={{
            marginTop: '28px',
            padding: '14px 18px',
            background: COLORS.bgSection,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            fontSize: '11px',
            color: COLORS.textSecondary,
            lineHeight: 1.6,
          }}
        >
          ⚠️ 본 계산서는 자동계산 결과이며, 실제 신고 전 반드시 공시지가 조회
          사이트 및 건축물대장과 비교 검증하시기 바랍니다. 매도예상가 분배는
          토지/건물 안분 산식(매도가 × 건물가액 / (토지가액 + 건물가액 ×
          1.1)) 기준이며 실제 거래 시 당사자 합의로 조정 가능합니다.
        </div>
      </div>

      {/* 푸터 */}
      <div
        style={{
          padding: '16px 40px',
          borderTop: `1px solid ${COLORS.border}`,
          fontSize: '11px',
          color: COLORS.textMuted,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>by 아톰세무회계</span>
        <span>atomtax-app.vercel.app</span>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: '20px' }}>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: COLORS.brand,
          marginBottom: '10px',
          letterSpacing: '0.02em',
        }}
      >
        ▣ {title}
      </div>
      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  sub,
  emphasize,
}: {
  label: string
  value: string
  sub?: string
  emphasize?: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: `1px solid ${COLORS.border}`,
        background: emphasize ? COLORS.bgHighlight : 'transparent',
      }}
    >
      <div style={{ color: COLORS.textSecondary, fontWeight: 500 }}>
        {label}
      </div>
      <div>
        <div
          style={{
            color: COLORS.text,
            fontWeight: emphasize ? 700 : 500,
            fontSize: emphasize ? '15px' : '13px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: '11px',
              marginTop: '4px',
              lineHeight: 1.5,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

function ResultRow({
  label,
  value,
  highlight,
  secondary,
}: {
  label: string
  value: string
  highlight?: boolean
  secondary?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: secondary ? '4px 0' : '6px 0',
      }}
    >
      <span
        style={{
          fontSize: secondary ? '11px' : '13px',
          color: secondary ? COLORS.textMuted : COLORS.text,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: highlight ? '17px' : secondary ? '11px' : '14px',
          fontWeight: highlight ? 800 : secondary ? 500 : 600,
          color: highlight ? COLORS.brand : COLORS.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  )
}
