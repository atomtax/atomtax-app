import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  toBillionWon, safePercentage, formatNumber,
} from '@/components/reports/print/CorporateTaxPrintTokens'
import type { IncomeStatementSummary } from '@/types/database'

interface Props {
  reportYear: number
  summary: IncomeStatementSummary | null
  periodLabel: string | null
}

interface RowDef {
  sign: '+' | '−' | '=' | null
  label: string
  key: keyof IncomeStatementSummary
  isResult: boolean
  isFinal: boolean
}

const ROWS: RowDef[] = [
  { sign: null, label: '매출액',           key: 'revenue',               isResult: true,  isFinal: false },
  { sign: '−',  label: '매출원가',         key: 'cogs',                  isResult: false, isFinal: false },
  { sign: '=',  label: '매출총이익',       key: 'gross_profit',          isResult: true,  isFinal: false },
  { sign: '−',  label: '판매비와 관리비',  key: 'sga',                   isResult: false, isFinal: false },
  { sign: '=',  label: '영업이익',         key: 'operating_income',      isResult: true,  isFinal: false },
  { sign: '+',  label: '영업외수익',       key: 'non_operating_revenue', isResult: false, isFinal: false },
  { sign: '−',  label: '영업외비용',       key: 'non_operating_expense', isResult: false, isFinal: false },
  { sign: '=',  label: '법인세차감전이익', key: 'pretax_income',         isResult: true,  isFinal: false },
  { sign: '−',  label: '법인세 비용',      key: 'corporate_tax',         isResult: false, isFinal: false },
  { sign: '=',  label: '당기순이익',       key: 'net_income',            isResult: true,  isFinal: true  },
]

export function IncomeStatementPage({ reportYear, summary, periodLabel }: Props) {
  const operatingMarginRate = safePercentage(summary?.operating_income, summary?.revenue)
  const revenue = summary?.revenue ?? 0

  return (
    <div className="page-container" style={a4PageStyle}>
      <ChapterHeader number="03" titleKo="손익계산서" titleEn="INCOME STATEMENT" reportYear={reportYear} />

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

        {/* 손익계산서 */}
        <div style={{ border: `1px solid ${PRINT_TOKENS.border}`, borderRadius: '8px', overflow: 'hidden' }}>
          {/* 헤더 행 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr auto 80px',
            gap: '14px',
            padding: '12px 20px',
            background: PRINT_TOKENS.bgSecondary,
            borderBottom: `1px solid ${PRINT_TOKENS.border}`,
            fontSize: '11px',
            color: PRINT_TOKENS.textSecondary,
            fontWeight: 600,
            letterSpacing: '0.5px',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          } as React.CSSProperties}>
            <span></span>
            <span>항목</span>
            <span style={{ textAlign: 'right', minWidth: '160px' }}>금액 (원)</span>
            <span style={{ textAlign: 'right' }}>비율</span>
          </div>

          {/* 데이터 행 */}
          {ROWS.map((row) => {
            const value = Number(summary?.[row.key] ?? 0)
            const ratio = revenue > 0 ? ((Math.abs(value) / revenue) * 100).toFixed(2) : '—'

            let rowBackground = 'white'
            let textColor: string = PRINT_TOKENS.textPrimary
            let fontWeight = 400

            if (row.isFinal) {
              rowBackground = `linear-gradient(90deg, ${PRINT_TOKENS.primaryBg} 0%, #fafbfc 100%)`
              textColor = PRINT_TOKENS.primary
              fontWeight = 600
            } else if (row.isResult) {
              rowBackground = PRINT_TOKENS.bgSubtle
              fontWeight = 600
            }

            const signBg = row.sign === '=' ? PRINT_TOKENS.primaryBgPill : PRINT_TOKENS.bgSecondary
            const signColor = row.sign === '=' ? PRINT_TOKENS.primary : PRINT_TOKENS.textSecondary

            return (
              <div
                key={row.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr auto 80px',
                  gap: '14px',
                  padding: '12px 20px',
                  alignItems: 'center',
                  borderBottom: `1px solid ${PRINT_TOKENS.borderLight}`,
                  background: rowBackground,
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                } as React.CSSProperties}
              >
                {/* 부호 배지 */}
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: row.sign ? signBg : 'transparent',
                  color: signColor,
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: 1,
                  flexShrink: 0,
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                } as React.CSSProperties}>
                  {row.sign ?? ''}
                </div>

                {/* 항목명 */}
                <span style={{ fontSize: '14px', color: textColor, fontWeight }}>
                  {row.label}
                </span>

                {/* 금액 */}
                <span style={{
                  fontSize: row.isFinal ? '16px' : '14px',
                  color: value < 0 ? PRINT_TOKENS.danger : textColor,
                  fontWeight,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '160px',
                  whiteSpace: 'nowrap',
                } as React.CSSProperties}>
                  {value < 0 ? '△ ' : ''}{formatNumber(Math.abs(value))}
                </span>

                {/* 비율 */}
                <span style={{
                  fontSize: '12px',
                  color: row.isFinal ? PRINT_TOKENS.primary : PRINT_TOKENS.textTertiary,
                  fontWeight: row.isFinal ? 600 : 400,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}>
                  {row.key === 'revenue' ? '100%' : ratio === '—' ? '—' : `${ratio}%`}
                </span>
              </div>
            )
          })}
        </div>

        {/* 한줄 요약 */}
        <div style={{
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '14px 18px', background: PRINT_TOKENS.bgSubtle, borderRadius: '6px',
          border: `1px solid ${PRINT_TOKENS.borderLight}`,
        }}>
          <div style={{ width: '4px', height: '36px', background: PRINT_TOKENS.primary, borderRadius: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '14px', color: PRINT_TOKENS.textSecondary, margin: 0, lineHeight: 1.6 }}>
            매출 {toBillionWon(summary?.revenue)} → 영업이익 {toBillionWon(summary?.operating_income)}
            ({operatingMarginRate === '—' ? '—' : `${operatingMarginRate}%`}) → 당기순이익 {toBillionWon(summary?.net_income)}으로 마감
          </p>
        </div>
      </div>

      <PageFooter pageNumber={3} totalPages={5} />
    </div>
  )
}
