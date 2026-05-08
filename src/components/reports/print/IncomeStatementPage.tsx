import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  toBillionWon, safePercentage, isLoss,
} from './CorporateTaxPrintTokens'
import type { IncomeStatementSummary } from '@/types/database'

interface Props {
  reportYear: number
  summary: IncomeStatementSummary | null
  periodLabel: string | null
}

const EMPTY: IncomeStatementSummary = {
  revenue: 0, cogs: 0, gross_profit: 0, sga: 0,
  operating_income: 0, non_operating_revenue: 0, non_operating_expense: 0,
  pretax_income: 0, corporate_tax: 0, net_income: 0,
}

interface Row {
  label: string
  value: number
  indent?: boolean
  highlight?: boolean
  bold?: boolean
  separator?: boolean
}

export function IncomeStatementPage({ reportYear, summary, periodLabel }: Props) {
  const s = summary ?? EMPTY
  const operatingMarginRate = safePercentage(s.operating_income, s.revenue)

  const rows: Row[] = [
    { label: '매출액', value: s.revenue, bold: true },
    { label: '매출원가', value: s.cogs, indent: true },
    { label: '매출총이익', value: s.gross_profit, bold: true, separator: true },
    { label: '판매비와관리비', value: s.sga, indent: true },
    { label: '영업이익', value: s.operating_income, bold: true, separator: true },
    { label: '영업외수익', value: s.non_operating_revenue, indent: true },
    { label: '영업외비용', value: s.non_operating_expense, indent: true },
    { label: '법인세차감전이익', value: s.pretax_income, bold: true, separator: true },
    { label: '법인세 비용', value: s.corporate_tax, indent: true },
    { label: '당기순이익', value: s.net_income, bold: true, highlight: true, separator: true },
  ]

  return (
    <div className="page-container" style={a4PageStyle}>
      <ChapterHeader number="04" titleKo="손익계산서" titleEn="INCOME STATEMENT" reportYear={reportYear} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 기간 라벨 */}
        {periodLabel && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            backgroundColor: PRINT_TOKENS.bgSecondary,
            borderRadius: '100px',
            border: `1px solid ${PRINT_TOKENS.border}`,
            alignSelf: 'flex-start',
          }}>
            <span style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary, fontWeight: 500 }}>
              기간: {periodLabel}
            </span>
          </div>
        )}

        {/* 손익계산서 테이블 */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              background: PRINT_TOKENS.bgSecondary,
              borderBottom: `2px solid ${PRINT_TOKENS.border}`,
            }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary }}>항목</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '160px' }}>금액 (원)</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '80px' }}>비율</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const loss = isLoss(row.value)
              const valueColor = row.highlight
                ? (loss ? PRINT_TOKENS.danger : PRINT_TOKENS.primary)
                : (loss ? PRINT_TOKENS.danger : PRINT_TOKENS.textPrimary)

              return (
                <tr
                  key={row.label}
                  style={{
                    borderBottom: row.separator
                      ? `2px solid ${PRINT_TOKENS.border}`
                      : `1px solid ${PRINT_TOKENS.borderLight}`,
                    background: row.highlight
                      ? `linear-gradient(90deg, ${PRINT_TOKENS.primaryBg} 0%, white 100%)`
                      : 'transparent',
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  } as React.CSSProperties}
                >
                  <td style={{
                    padding: row.indent ? '8px 12px 8px 28px' : '8px 12px',
                    fontSize: row.bold ? '16px' : '14px',
                    fontWeight: row.bold ? 700 : 400,
                    color: row.bold ? PRINT_TOKENS.textPrimary : PRINT_TOKENS.textSecondary,
                  }}>
                    {row.indent && (
                      <span style={{ marginRight: '6px', color: PRINT_TOKENS.textMuted }}>└</span>
                    )}
                    {row.label}
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontSize: row.bold ? '16px' : '14px',
                    fontWeight: row.bold ? 700 : 400,
                    color: valueColor,
                    whiteSpace: 'nowrap',
                  }}>
                    {loss && <span style={{ marginRight: '2px', fontSize: '13px' }}>△</span>}
                    {Math.abs(row.value).toLocaleString('ko-KR')}
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontSize: '13px',
                    color: PRINT_TOKENS.textTertiary,
                    whiteSpace: 'nowrap',
                  }}>
                    {row.label === '매출액' ? '100%' : safePercentage(Math.abs(row.value), s.revenue) === '—' ? '—' : `${safePercentage(Math.abs(row.value), s.revenue)}%`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* 한줄 요약 */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '14px 18px', background: PRINT_TOKENS.bgSubtle, borderRadius: '6px',
          border: `1px solid ${PRINT_TOKENS.borderLight}`,
        }}>
          <div style={{ width: '4px', height: '36px', background: PRINT_TOKENS.primary, borderRadius: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '14px', color: PRINT_TOKENS.textSecondary, margin: 0, lineHeight: 1.6 }}>
            매출 {toBillionWon(s.revenue)} → 영업이익 {toBillionWon(s.operating_income)}
            ({operatingMarginRate === '—' ? '—' : `${operatingMarginRate}%`}) → 당기순이익 {toBillionWon(s.net_income)}으로 마감
          </p>
        </div>
      </div>

      <PageFooter pageNumber={4} />
    </div>
  )
}
