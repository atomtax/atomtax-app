import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  toBillionWon, safePercentage, formatSignedAmount, isLoss,
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
    <div style={a4PageStyle}>
      <ChapterHeader number="04" titleKo="손익계산서" titleEn="INCOME STATEMENT" reportYear={reportYear} />

      {/* 기간 라벨 */}
      {periodLabel && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px',
          backgroundColor: PRINT_TOKENS.bgSecondary,
          borderRadius: '100px',
          marginBottom: '16px',
          border: `1px solid ${PRINT_TOKENS.border}`,
        }}>
          <span style={{ fontSize: '9px', color: PRINT_TOKENS.textTertiary, fontWeight: 500 }}>
            기간: {periodLabel}
          </span>
        </div>
      )}

      {/* 손익계산서 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <thead>
          <tr style={{
            background: PRINT_TOKENS.bgSecondary,
            borderBottom: `2px solid ${PRINT_TOKENS.border}`,
          }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 600, color: PRINT_TOKENS.textSecondary }}>항목</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '160px' }}>금액 (원)</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '80px' }}>비율</th>
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
                  fontSize: row.bold ? '11px' : '10px',
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
                  fontSize: row.bold ? '11px' : '10px',
                  fontWeight: row.bold ? 700 : 400,
                  color: valueColor,
                  whiteSpace: 'nowrap',
                }}>
                  {loss && <span style={{ marginRight: '2px', fontSize: '9px' }}>△</span>}
                  {Math.abs(row.value).toLocaleString('ko-KR')}
                </td>
                <td style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  fontSize: '9px',
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

      {/* 요약 하단 배너 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
      }}>
        {[
          { label: '총 매출액', value: s.revenue, pct: undefined as string | undefined, bg: PRINT_TOKENS.primaryDark },
          { label: '영업이익률', value: null as number | null, pct: safePercentage(s.operating_income, s.revenue), bg: PRINT_TOKENS.primaryMid },
          { label: '당기순이익', value: s.net_income, pct: undefined as string | undefined, bg: isLoss(s.net_income) ? PRINT_TOKENS.danger : PRINT_TOKENS.primaryLight },
        ].map(({ label, value, pct, bg }) => (
          <div key={label} style={{
            background: bg, borderRadius: '6px', padding: '12px 14px',
            WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
          } as React.CSSProperties}>
            <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.85)', margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
            {pct !== undefined ? (
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', margin: 0 }}>
                {pct === '—' ? '—' : `${pct}%`}
              </p>
            ) : (
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'white', margin: 0, whiteSpace: 'nowrap' }}>
                {formatSignedAmount(value)}
                <span style={{ fontSize: '9px', fontWeight: 400, marginLeft: '2px', opacity: 0.85 }}>원</span>
              </p>
            )}
            {value != null && (
              <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)', margin: '3px 0 0' }}>
                {toBillionWon(value)} 억원
              </p>
            )}
          </div>
        ))}
      </div>

      <PageFooter pageNumber={4} />
    </div>
  )
}
