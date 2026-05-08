import type React from 'react'

export const PRINT_TOKENS = {
  primaryDark:    '#1e3a8a',
  primary:        '#1e40af',
  primaryMid:     '#2563eb',
  primaryLight:   '#3b82f6',
  primaryAccent:  '#60a5fa',
  primarySoft:    '#93c5fd',
  primaryBg:      '#eff6ff',
  primaryBgPill:  '#dbeafe',

  successDark:    '#047857',
  success:        '#059669',

  textPrimary:    '#0f172a',
  textSecondary:  '#475569',
  textTertiary:   '#64748b',
  textMuted:      '#94a3b8',

  border:         '#cbd5e1',
  borderLight:    '#e2e8f0',
  bgSubtle:       '#fafbfc',
  bgSecondary:    '#f1f5f9',

  danger:         '#dc2626',
  dangerBg:       '#fef2f2',
} as const

export const a4PageStyle: React.CSSProperties = {
  width: '210mm',
  height: '297mm',
  boxSizing: 'border-box',
  padding: '20mm 18mm',
  margin: '0 auto',
  backgroundColor: 'white',
  display: 'flex',
  flexDirection: 'column',
  pageBreakAfter: 'always',
  pageBreakInside: 'avoid',
  breakAfter: 'page',
  breakInside: 'avoid',
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
  fontFamily: 'Inter, -apple-system, sans-serif',
  position: 'relative',
  overflow: 'hidden',
}

export const a4LastPageStyle: React.CSSProperties = {
  ...a4PageStyle,
  pageBreakAfter: 'auto',
  breakAfter: 'auto',
}

export const chapterHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px',
  paddingBottom: '14px',
  borderBottom: `1px solid ${PRINT_TOKENS.border}`,
}

export const pageFooterStyle: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: '16px',
  borderTop: `1px solid ${PRINT_TOKENS.border}`,
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  color: PRINT_TOKENS.textMuted,
  letterSpacing: '0.5px',
  fontWeight: 500,
}

// ── 유틸 ──────────────────────────────────────────────────────────

export function toBillionWon(amount: number | null | undefined): string {
  if (amount == null || amount === 0) return '0'
  const sign = amount < 0 ? '△' : ''
  const abs = Math.abs(amount)
  const billion = abs / 100_000_000
  if (billion >= 1) return sign + billion.toFixed(1) + '억'
  const million = abs / 1_000_000
  if (million >= 1) return sign + million.toFixed(0) + '백만'
  return sign + abs.toLocaleString('ko-KR') + '원'
}

export function safePercentage(
  numerator: number | null | undefined,
  denominator: number | null | undefined
): string {
  if (numerator == null || denominator == null || denominator === 0) return '—'
  return ((numerator / denominator) * 100).toFixed(2)
}

export function formatNumber(amount: number | null | undefined): string {
  if (amount == null) return '0'
  return Math.abs(amount).toLocaleString('ko-KR')
}

export function formatSignedAmount(amount: number | null | undefined): string {
  if (amount == null) return '0'
  if (amount < 0) return '△ ' + Math.abs(amount).toLocaleString('ko-KR')
  return amount.toLocaleString('ko-KR')
}

export function isLoss(amount: number | null | undefined): boolean {
  return amount != null && amount < 0
}

// ── 공통 서브컴포넌트 ──────────────────────────────────────────────

interface ChapterHeaderProps {
  number: string
  titleKo: string
  titleEn: string
  reportYear: number
}

export function ChapterHeader({ number, titleKo, titleEn, reportYear }: ChapterHeaderProps) {
  return (
    <div style={chapterHeaderStyle}>
      <div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '4px 12px', backgroundColor: PRINT_TOKENS.primaryBgPill,
          borderRadius: '100px', marginBottom: '10px',
        }}>
          <span style={{
            fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.primary,
            letterSpacing: '0.8px',
          }}>CHAPTER {number}</span>
        </div>
        <h2 style={{
          fontSize: '28px', fontWeight: 600, color: PRINT_TOKENS.textPrimary,
          margin: 0, letterSpacing: '-0.4px',
        }}>{titleKo}</h2>
        <p style={{
          fontSize: '16px', color: PRINT_TOKENS.textTertiary,
          margin: '3px 0 0', letterSpacing: '0.3px', fontWeight: 500,
        }}>{titleEn}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '13px', color: PRINT_TOKENS.textMuted, margin: 0, letterSpacing: '1px', fontWeight: 500 }}>ATOM TAX</p>
        <p style={{ fontSize: '13px', color: PRINT_TOKENS.textMuted, margin: '2px 0 0' }}>FY {reportYear}</p>
      </div>
    </div>
  )
}

interface PageFooterProps {
  pageNumber: number
  totalPages?: number
}

export function PageFooter({ pageNumber, totalPages = 5 }: PageFooterProps) {
  return (
    <div style={pageFooterStyle}>
      <span>아톰세무회계</span>
      <span>{String(pageNumber).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}</span>
    </div>
  )
}
