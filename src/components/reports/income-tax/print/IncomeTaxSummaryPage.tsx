import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  formatNumber, formatSignedAmount,
} from '@/components/reports/print/CorporateTaxPrintTokens'
import type { IncomeTaxReport } from '@/types/database'

interface RowDef {
  sign: '+' | '−' | '=' | null
  label: string
  sublabel?: string
  incomeKey: keyof IncomeTaxReport
  ruralKey: keyof IncomeTaxReport | null
  isResult: boolean
  isFinal: boolean
  isRate?: boolean
}

const ROWS: RowDef[] = [
  { sign: null, label: '종합소득금액',                    incomeKey: 'income_total',             ruralKey: 'rural_total',             isResult: true,  isFinal: false },
  { sign: '−',  label: '소득공제계',                      incomeKey: 'income_deduction',         ruralKey: 'rural_deduction',         isResult: false, isFinal: false },
  { sign: '=',  label: '과세표준',                        incomeKey: 'income_tax_base',          ruralKey: 'rural_tax_base',          isResult: true,  isFinal: false },
  { sign: null, label: '세율',                             incomeKey: 'income_applied_rate',      ruralKey: null,                      isResult: false, isFinal: false, isRate: true },
  { sign: '=',  label: '산출세액',                        incomeKey: 'income_calculated_tax',    ruralKey: 'rural_calculated_tax',    isResult: true,  isFinal: false },
  { sign: '−',  label: '세액감면',                        incomeKey: 'income_tax_reduction',     ruralKey: 'rural_tax_reduction',     isResult: false, isFinal: false },
  { sign: '−',  label: '세액공제',                        incomeKey: 'income_tax_credit',        ruralKey: 'rural_tax_credit',        isResult: false, isFinal: false },
  { sign: '=',  label: '결정세액', sublabel: '종합과세',  incomeKey: 'income_comprehensive_tax', ruralKey: 'rural_comprehensive_tax', isResult: true,  isFinal: false },
  { sign: '+',  label: '분리과세',                        incomeKey: 'income_separate_tax',      ruralKey: 'rural_separate_tax',      isResult: false, isFinal: false },
  { sign: '+',  label: '가산세',                          incomeKey: 'income_penalty_tax',       ruralKey: 'rural_penalty_tax',       isResult: false, isFinal: false },
  { sign: '+',  label: '추가납부세액',                    incomeKey: 'income_additional_tax',    ruralKey: 'rural_additional_tax',    isResult: false, isFinal: false },
  { sign: '−',  label: '기납부세액',                      incomeKey: 'income_prepaid_tax',       ruralKey: 'rural_prepaid_tax',       isResult: false, isFinal: false },
  { sign: '=',  label: '납부(환급)할 총세액',             incomeKey: 'income_payable',           ruralKey: 'rural_payable',           isResult: true,  isFinal: false },
  { sign: '+',  label: '지방소득세', sublabel: '(총세액 × 10%)', incomeKey: 'income_local_tax', ruralKey: null,                       isResult: false, isFinal: false },
  { sign: '+',  label: '농어촌특별세', sublabel: '(홈택스 입력)', incomeKey: 'farm_special_tax', ruralKey: null,                      isResult: false, isFinal: false },
  { sign: '=',  label: '최종 납부할 세액', sublabel: '(지방세 + 농특세 포함)', incomeKey: 'income_final_with_local', ruralKey: null,   isResult: true,  isFinal: true  },
]

interface Props {
  reportYear: number
  report: IncomeTaxReport
  chapterNumber?: string
  pageNumber?: number
  totalPages?: number
}

export function IncomeTaxSummaryPage({
  reportYear,
  report,
  chapterNumber = '02',
  pageNumber = 2,
  totalPages = 5,
}: Props) {
  const finalWithLocal = report.income_final_with_local
  const isRefund = finalWithLocal < 0

  return (
    <div className="page-container" style={a4PageStyle}>
      <ChapterHeader number={chapterNumber} titleKo="신고 개요" titleEn="FILING OVERVIEW" reportYear={reportYear} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Hero 카드 — 옵션 C: 좌(명칭) ↔ 우(금액) */}
        <div style={{
          padding: '24px 28px',
          background: isRefund
            ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)'
            : 'linear-gradient(135deg, #047857 0%, #059669 100%)',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        } as React.CSSProperties}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '30px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '20px',
          }}>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: 'white', margin: 0, lineHeight: 1.1 }}>
                {isRefund ? '최종 환급세액' : '최종 납부할 세액'}
              </p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', margin: '6px 0 0', letterSpacing: '1.2px', fontWeight: 500 }}>
                {isRefund ? 'FINAL TAX REFUND' : 'FINAL TAX PAYABLE'}
              </p>
            </div>
            <p style={{ fontSize: '38px', fontWeight: 600, color: 'white', margin: 0, letterSpacing: '-1px', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {formatNumber(Math.abs(finalWithLocal))}
              <span style={{ fontSize: '18px', fontWeight: 400, color: 'rgba(255,255,255,0.85)', marginLeft: '6px' }}>원</span>
            </p>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', margin: '14px 0 0', position: 'relative' }}>
            {isRefund
              ? '기납부세액이 결정세액보다 많아 환급 대상입니다 (지방소득세 포함)'
              : `종합소득세 + 지방소득세 (납부할 총세액 × 10%)${
                  Number(report.farm_special_tax) > 0 ? ' + 농어촌특별세' : ''
                }`}
          </p>
        </div>

        {/* 부호 배지 표 */}
        <div style={{ border: `1px solid ${PRINT_TOKENS.border}`, borderRadius: '8px', overflow: 'hidden' }}>
          {/* 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 160px 120px',
            gap: '14px',
            padding: '10px 20px',
            background: PRINT_TOKENS.bgSecondary,
            borderBottom: `1px solid ${PRINT_TOKENS.border}`,
            fontSize: '11px',
            color: PRINT_TOKENS.textSecondary,
            fontWeight: 600,
            letterSpacing: '0.5px',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          } as React.CSSProperties}>
            <span />
            <span>구분</span>
            <span style={{ textAlign: 'right' }}>종합소득세 (원)</span>
            <span style={{ textAlign: 'right' }}>농어촌특별세 (원)</span>
          </div>

          {ROWS.filter((row) => {
            // 농특세 0 인 보고서는 행 숨김 (조건부)
            if (row.incomeKey === 'farm_special_tax') {
              return Number(report.farm_special_tax) > 0
            }
            return true
          }).map((row, idx) => {
            const incomeVal = Number(report[row.incomeKey] ?? 0)
            const ruralVal = row.ruralKey !== null ? Number(report[row.ruralKey] ?? 0) : null

            let rowBg: string = 'white'
            let textColor: string = PRINT_TOKENS.textPrimary
            let fontWeight = 400

            if (row.isFinal) {
              rowBg = `linear-gradient(90deg, ${PRINT_TOKENS.primaryBg} 0%, #fafbfc 100%)`
              textColor = PRINT_TOKENS.primary
              fontWeight = 700
            } else if (row.isResult) {
              rowBg = PRINT_TOKENS.bgSubtle
              fontWeight = 600
            }

            const signBg = row.sign === '=' ? PRINT_TOKENS.primaryBgPill : PRINT_TOKENS.bgSecondary
            const signColor = row.sign === '=' ? PRINT_TOKENS.primary : PRINT_TOKENS.textSecondary

            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 160px 120px',
                  gap: '14px',
                  padding: '9px 20px',
                  alignItems: 'center',
                  borderBottom: `1px solid ${PRINT_TOKENS.borderLight}`,
                  background: rowBg,
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
                  paddingBottom: '2px',
                  flexShrink: 0,
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                } as React.CSSProperties}>
                  {row.sign ?? ''}
                </div>

                {/* 항목명 */}
                <div>
                  <span style={{ fontSize: '13px', color: textColor, fontWeight }}>
                    {row.label}
                  </span>
                  {row.sublabel && (
                    <span style={{ fontSize: '11px', color: row.isFinal ? PRINT_TOKENS.primaryAccent : PRINT_TOKENS.textTertiary, marginLeft: '6px' }}>
                      {row.sublabel}
                    </span>
                  )}
                </div>

                {/* 종합소득세 값 */}
                <span style={{
                  fontSize: row.isFinal ? '15px' : '13px',
                  color: incomeVal < 0 ? PRINT_TOKENS.danger : textColor,
                  fontWeight,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                } as React.CSSProperties}>
                  {row.isRate ? `${incomeVal}%` : formatSignedAmount(incomeVal)}
                </span>

                {/* 농어촌특별세 값 */}
                <span style={{
                  fontSize: '13px',
                  color: ruralVal !== null && ruralVal < 0 ? PRINT_TOKENS.danger : textColor,
                  fontWeight: row.isFinal ? fontWeight : 400,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                } as React.CSSProperties}>
                  {row.isRate || ruralVal === null
                    ? <span style={{ color: PRINT_TOKENS.textMuted }}>—</span>
                    : formatSignedAmount(ruralVal)
                  }
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  )
}
