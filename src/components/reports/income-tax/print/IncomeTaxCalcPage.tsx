import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  formatNumber,
} from '@/components/reports/print/CorporateTaxPrintTokens'
import type { IncomeTaxReport } from '@/types/database'

interface RowDef {
  label: string
  sublabel?: string
  incomeKey: keyof IncomeTaxReport
  ruralKey: keyof IncomeTaxReport
  type: 'input' | 'auto'
  emphasize?: boolean
  highlight?: 'green'
  ruralDisabled?: boolean
}

const ROWS: RowDef[] = [
  { label: '종합소득금액',               incomeKey: 'income_total',            ruralKey: 'rural_total',            type: 'input' },
  { label: '소득공제계',                 incomeKey: 'income_deduction',        ruralKey: 'rural_deduction',        type: 'input' },
  { label: '과세표준',                   incomeKey: 'income_tax_base',         ruralKey: 'rural_tax_base',         type: 'auto', emphasize: true },
  { label: '세율',                       incomeKey: 'income_applied_rate',     ruralKey: 'income_applied_rate',    type: 'auto', ruralDisabled: true },
  { label: '산출세액',                   incomeKey: 'income_calculated_tax',   ruralKey: 'rural_calculated_tax',   type: 'auto', emphasize: true },
  { label: '세액감면',                   incomeKey: 'income_tax_reduction',    ruralKey: 'rural_tax_reduction',    type: 'input' },
  { label: '세액공제',                   incomeKey: 'income_tax_credit',       ruralKey: 'rural_tax_credit',       type: 'input' },
  { label: '결정세액 — 종합과세',        incomeKey: 'income_comprehensive_tax', ruralKey: 'rural_comprehensive_tax', type: 'auto' },
  { label: '결정세액 — 분리과세',        incomeKey: 'income_separate_tax',     ruralKey: 'rural_separate_tax',     type: 'input' },
  { label: '결정세액 합계',              incomeKey: 'income_determined_total', ruralKey: 'rural_determined_total', type: 'auto', emphasize: true },
  { label: '가산세',                     incomeKey: 'income_penalty_tax',      ruralKey: 'rural_penalty_tax',      type: 'input' },
  { label: '추가납부세액',               incomeKey: 'income_additional_tax',   ruralKey: 'rural_additional_tax',   type: 'input' },
  { label: '합계',                       incomeKey: 'income_total_tax',        ruralKey: 'rural_total_tax',        type: 'auto', emphasize: true },
  { label: '기납부세액계',               incomeKey: 'income_prepaid_tax',      ruralKey: 'rural_prepaid_tax',      type: 'input' },
  { label: '납부(환급)할 총세액',        incomeKey: 'income_payable',          ruralKey: 'rural_payable',          type: 'auto', emphasize: true },
  { label: '주식매수 특례 — 차감',       incomeKey: 'income_stock_deduct',     ruralKey: 'rural_stock_deduct',     type: 'input' },
  { label: '주식매수 특례 — 가산',       incomeKey: 'income_stock_add',        ruralKey: 'rural_stock_add',        type: 'input' },
  { label: '분납할세액',                 incomeKey: 'income_installment',      ruralKey: 'rural_installment',      type: 'input' },
  { label: '신고기한내 납부할 세액',     incomeKey: 'income_within_deadline',  ruralKey: 'rural_within_deadline',  type: 'auto', emphasize: true },
  { label: '국세환급금 충당',            incomeKey: 'income_refund_offset',    ruralKey: 'income_refund_offset',   type: 'input', ruralDisabled: true },
  { label: '충당후 납부(환급)할 세액',   incomeKey: 'income_final_payable',    ruralKey: 'rural_final_payable',    type: 'auto', emphasize: true, highlight: 'green' },
]

interface Props {
  reportYear: number
  report: IncomeTaxReport
}

function renderValue(val: number, isRate: boolean, isNeg: boolean, isFinal: boolean): string {
  if (isRate) return `${val}%`
  if (isNeg) return `△ ${formatNumber(Math.abs(val))}`
  return formatNumber(val)
}

export function IncomeTaxCalcPage({ reportYear, report }: Props) {
  return (
    <div className="page-container" style={a4PageStyle}>
      <ChapterHeader number="02" titleKo="세액의 계산" titleEn="TAX CALCULATION" reportYear={reportYear} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{
              background: PRINT_TOKENS.primaryBgPill,
              borderBottom: `2px solid ${PRINT_TOKENS.primaryAccent}`,
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
            } as React.CSSProperties}>
              <th style={{ padding: '7px 10px', textAlign: 'left', color: PRINT_TOKENS.primary, fontWeight: 700, width: '42%' }}>
                구분
              </th>
              <th style={{ padding: '7px 10px', textAlign: 'right', color: PRINT_TOKENS.primary, fontWeight: 700, width: '29%' }}>
                종합소득세
              </th>
              <th style={{ padding: '7px 10px', textAlign: 'right', color: PRINT_TOKENS.primary, fontWeight: 700, width: '29%' }}>
                농어촌특별세
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, idx) => {
              const isFinal = row.highlight === 'green'
              const isRate = row.label === '세율'

              const incomeVal = Number(report[row.incomeKey] ?? 0)
              const ruralVal = row.ruralDisabled ? null : Number(report[row.ruralKey] ?? 0)

              const incomeNeg = incomeVal < 0
              const ruralNeg = ruralVal !== null && ruralVal < 0

              const rowBg = isFinal
                ? `linear-gradient(135deg, ${PRINT_TOKENS.successDark} 0%, ${PRINT_TOKENS.success} 100%)`
                : row.emphasize
                ? PRINT_TOKENS.primaryBg
                : 'transparent'

              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: `1px solid ${PRINT_TOKENS.borderLight}`,
                    background: isFinal || row.emphasize ? rowBg : undefined,
                    WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
                  } as React.CSSProperties}
                >
                  <td style={{
                    padding: '5px 10px',
                    color: isFinal ? 'white' : row.emphasize ? PRINT_TOKENS.primary : PRINT_TOKENS.textSecondary,
                    fontWeight: row.emphasize || isFinal ? 700 : 400,
                    lineHeight: 1.3,
                  }}>
                    <div style={{ fontSize: '13px' }}>{row.label}</div>
                    {row.sublabel && (
                      <div style={{ fontSize: '11px', color: isFinal ? 'rgba(255,255,255,0.7)' : PRINT_TOKENS.textMuted, marginTop: '1px' }}>
                        {row.sublabel}
                      </div>
                    )}
                  </td>

                  <td style={{
                    padding: '5px 10px',
                    textAlign: 'right',
                    fontSize: isRate ? '14px' : '13px',
                    fontWeight: row.emphasize || isFinal ? 700 : 400,
                    color: isFinal ? 'white' : incomeNeg ? PRINT_TOKENS.danger : row.emphasize ? PRINT_TOKENS.primary : PRINT_TOKENS.textPrimary,
                    whiteSpace: 'nowrap',
                  }}>
                    {renderValue(incomeVal, isRate, incomeNeg, isFinal)}
                  </td>

                  <td style={{
                    padding: '5px 10px',
                    textAlign: 'right',
                    fontSize: '13px',
                    fontWeight: row.emphasize || isFinal ? 700 : 400,
                    color: isFinal ? 'white' : ruralNeg ? PRINT_TOKENS.danger : row.emphasize ? PRINT_TOKENS.primary : PRINT_TOKENS.textPrimary,
                    whiteSpace: 'nowrap',
                  }}>
                    {row.ruralDisabled
                      ? <span style={{ color: isFinal ? 'rgba(255,255,255,0.4)' : PRINT_TOKENS.textMuted }}>—</span>
                      : renderValue(ruralVal ?? 0, false, ruralNeg, isFinal)
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <PageFooter pageNumber={3} totalPages={5} />
    </div>
  )
}
