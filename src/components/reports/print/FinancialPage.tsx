import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  toBillionWon, safePercentage, formatSignedAmount, isLoss,
} from './CorporateTaxPrintTokens'
import type { IncomeStatementSummary } from '@/types/database'

interface Props {
  reportYear: number
  summary: IncomeStatementSummary | null
  finalTax: number
}

const EMPTY: IncomeStatementSummary = {
  revenue: 0, cogs: 0, gross_profit: 0, sga: 0,
  operating_income: 0, non_operating_revenue: 0, non_operating_expense: 0,
  pretax_income: 0, corporate_tax: 0, net_income: 0,
}

export function FinancialPage({ reportYear, summary, finalTax }: Props) {
  const s = summary ?? EMPTY

  const cogsRate = safePercentage(s.cogs, s.revenue)
  const operatingMarginRate = safePercentage(s.operating_income, s.revenue)
  const effectiveTaxRate = safePercentage(finalTax, s.pretax_income)

  const operatingLabel = isLoss(s.operating_income) ? '영업손실' : '영업이익'
  const netIncomeLabel = isLoss(s.net_income) ? '당기순손실' : '당기 순이익'

  const BAR_START = 90
  const BAR_MAX = 270
  const rev = s.revenue || 1
  const cogsWidth = Math.max(0, Math.min((s.cogs / rev) * BAR_MAX, BAR_MAX))
  const opIncRatio = s.operating_income / rev
  const opIncWidth = Math.max(0, Math.min(Math.abs(opIncRatio) * BAR_MAX, BAR_MAX))

  const metrics = [
    { label: '매출원가율', value: cogsRate === '—' ? '—' : `${cogsRate}%`, color: PRINT_TOKENS.textPrimary },
    { label: '영업이익률', value: operatingMarginRate === '—' ? '—' : `${operatingMarginRate}%`, color: PRINT_TOKENS.textPrimary },
    { label: '실효세율', value: effectiveTaxRate === '—' ? '—' : `${effectiveTaxRate}%`, color: PRINT_TOKENS.primary },
  ]

  return (
    <div className="page-container" style={a4PageStyle}>
      <ChapterHeader number="01" titleKo="재무 현황" titleEn="FINANCIAL STATUS" reportYear={reportYear} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* ─ 3원화 카드 ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { label: '당기 매출액', bg: PRINT_TOKENS.primaryDark, value: s.revenue, showRatio: false },
            { label: operatingLabel, bg: PRINT_TOKENS.primaryMid, value: s.operating_income, showRatio: true, denominator: s.revenue },
            { label: netIncomeLabel, bg: PRINT_TOKENS.primaryAccent, value: s.net_income, showRatio: true, denominator: s.revenue },
          ].map(({ label, bg, value, showRatio, denominator }) => (
            <div key={label} style={{
              background: bg, borderRadius: '8px', padding: '18px 16px 16px',
              position: 'relative', overflow: 'hidden',
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
            } as React.CSSProperties}>
              <div style={{
                position: 'absolute', top: '-14px', right: '-14px',
                width: '60px', height: '60px',
                background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
              }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', margin: '0 0 10px', fontWeight: 500 }}>
                {label}
              </p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0, whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
                {formatSignedAmount(value)}
                <span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '2px', opacity: 0.85 }}>원</span>
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '8px 0 0', fontWeight: 400 }}>
                {toBillionWon(value)}
                {showRatio && denominator && denominator !== 0 && (
                  <span style={{ marginLeft: '8px' }}>({safePercentage(value, denominator)}%)</span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* ─ 흐름 차트 ─ */}
        <div style={{
          border: `1px solid ${PRINT_TOKENS.border}`,
          borderRadius: '8px', padding: '18px 20px',
        }}>
          <p style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary, margin: '0 0 14px', fontWeight: 600, letterSpacing: '0.4px' }}>
            FINANCIAL FLOW  <span style={{ fontWeight: 400, marginLeft: '6px' }}>단위: 억원</span>
          </p>
          <svg viewBox="0 0 392 138" width="100%" style={{ display: 'block', overflow: 'visible' }}>
            {/* 매출액 */}
            <text x={BAR_START - 8} y="22" fontSize="13" fill={PRINT_TOKENS.textSecondary} textAnchor="end" dominantBaseline="middle" fontWeight="500">매출액</text>
            <rect x={BAR_START} y="8" width={BAR_MAX} height="28" rx="3" fill={PRINT_TOKENS.primaryDark}
              style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties} />
            <text x={BAR_START + BAR_MAX + 8} y="22" fontSize="13" fill={PRINT_TOKENS.textSecondary} dominantBaseline="middle">
              {toBillionWon(s.revenue)}
            </text>

            {/* 매출원가 */}
            <text x={BAR_START - 8} y="67" fontSize="13" fill={PRINT_TOKENS.textSecondary} textAnchor="end" dominantBaseline="middle" fontWeight="500">매출원가</text>
            <rect x={BAR_START} y="53" width={cogsWidth} height="28" rx="3" fill={PRINT_TOKENS.primaryLight}
              style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties} />
            <text x={BAR_START + cogsWidth + 8} y="67" fontSize="13" fill={PRINT_TOKENS.textSecondary} dominantBaseline="middle">
              {cogsRate === '—' ? '—' : `${cogsRate}%`}
            </text>

            {/* 영업이익 */}
            <text x={BAR_START - 8} y="113" fontSize="13" fill={PRINT_TOKENS.textSecondary} textAnchor="end" dominantBaseline="middle" fontWeight="500">{operatingLabel}</text>
            {opIncWidth > 0 && (
              <rect x={BAR_START} y="99" width={opIncWidth} height="28" rx="3" fill={PRINT_TOKENS.primaryAccent}
                style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties} />
            )}
            <text x={BAR_START + opIncWidth + 8} y="113" fontSize="13" fill={PRINT_TOKENS.textSecondary} dominantBaseline="middle">
              {isLoss(s.operating_income) ? '△' : ''}{toBillionWon(s.operating_income)} ({operatingMarginRate === '—' ? '—' : `${operatingMarginRate}%`})
            </text>
          </svg>
        </div>

        {/* ─ 핵심 지표 3개 ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {metrics.map(({ label, value, color }) => (
            <div key={label} style={{
              border: `1px solid ${PRINT_TOKENS.border}`,
              borderRadius: '6px', padding: '18px 20px',
            }}>
              <p style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary, margin: '0 0 8px', fontWeight: 500 }}>{label}</p>
              <p style={{ fontSize: '26px', fontWeight: 600, color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        <div>
          <p style={{ fontSize: '12px', color: PRINT_TOKENS.textTertiary, margin: 0 }}>
            * 실효세율 = 최종납부세액 ÷ 법인세차감전이익
          </p>
        </div>
      </div>

      <PageFooter pageNumber={1} />
    </div>
  )
}
