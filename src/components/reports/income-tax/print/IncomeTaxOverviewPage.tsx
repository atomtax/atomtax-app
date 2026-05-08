import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  formatNumber, toBillionWon,
} from '@/components/reports/print/CorporateTaxPrintTokens'
import type { IncomeTaxReport } from '@/types/database'

interface Props {
  reportYear: number
  report: IncomeTaxReport
}

export function IncomeTaxOverviewPage({ reportYear, report }: Props) {
  const finalPayable = report.income_final_payable
  const isRefund = finalPayable < 0

  const keyMetrics = [
    {
      label: '종합소득금액',
      value: `${formatNumber(report.income_total)}원`,
      sub: toBillionWon(report.income_total),
      bg: PRINT_TOKENS.primaryDark,
    },
    {
      label: '결정세액 합계',
      value: `${formatNumber(report.income_determined_total)}원`,
      sub: toBillionWon(report.income_determined_total),
      bg: PRINT_TOKENS.primary,
    },
    {
      label: '기납부세액',
      value: `${formatNumber(report.income_prepaid_tax)}원`,
      sub: toBillionWon(report.income_prepaid_tax),
      bg: PRINT_TOKENS.primaryMid,
    },
  ]

  const summaryRows = [
    { label: '종합소득금액', value: report.income_total, indent: false },
    { label: '소득공제계', value: report.income_deduction, indent: true },
    { label: '과세표준', value: report.income_tax_base, indent: false, bold: true },
    { label: `세율 적용 (${report.income_applied_rate}%)`, value: report.income_calculated_tax, indent: true, isRate: true },
    { label: '산출세액', value: report.income_calculated_tax, indent: false, bold: true },
    { label: '세액감면', value: report.income_tax_reduction, indent: true },
    { label: '세액공제', value: report.income_tax_credit, indent: true },
    { label: '결정세액 합계', value: report.income_determined_total, indent: false, bold: true },
    { label: '기납부세액', value: report.income_prepaid_tax, indent: true },
    { label: '납부(환급)할 총세액', value: report.income_payable, indent: false, bold: true },
  ]

  return (
    <div className="page-container" style={a4PageStyle}>
      <ChapterHeader number="01" titleKo="신고 개요" titleEn="FILING OVERVIEW" reportYear={reportYear} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 핵심 지표 3개 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {keyMetrics.map(({ label, value, sub, bg }) => (
            <div key={label} style={{
              background: bg, borderRadius: '8px', padding: '14px 16px',
              position: 'relative', overflow: 'hidden',
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
            } as React.CSSProperties}>
              <div style={{
                position: 'absolute', top: '-10px', right: '-10px',
                width: '44px', height: '44px',
                background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
              }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '0 0 8px', fontWeight: 500 }}>{label}</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0, whiteSpace: 'nowrap' }}>{value}</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* 최종 납부(환급) 세액 Hero */}
        <div style={{
          borderRadius: '10px',
          padding: '20px 24px',
          background: isRefund
            ? `linear-gradient(135deg, ${PRINT_TOKENS.successDark} 0%, ${PRINT_TOKENS.success} 100%)`
            : `linear-gradient(135deg, ${PRINT_TOKENS.primaryDark} 0%, ${PRINT_TOKENS.primaryMid} 100%)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        } as React.CSSProperties}>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 6px', fontWeight: 500 }}>
              충당 후 {isRefund ? '환급' : '납부'}할 세액 (최종)
            </p>
            <p style={{ fontSize: '44px', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
              {isRefund ? '△ ' : ''}{formatNumber(Math.abs(finalPayable))}
              <span style={{ fontSize: '20px', fontWeight: 400, marginLeft: '4px' }}>원</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              {toBillionWon(Math.abs(finalPayable))}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
              {reportYear}년도 종합소득세
            </p>
          </div>
        </div>

        {/* 계산 흐름 요약 테이블 */}
        <div style={{ border: `1px solid ${PRINT_TOKENS.border}`, borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px',
            background: PRINT_TOKENS.bgSecondary,
            borderBottom: `1px solid ${PRINT_TOKENS.border}`,
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, letterSpacing: '0.4px' }}>
              세액 계산 흐름 요약
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {summaryRows.map((row, i) => {
                if (row.isRate) return null
                const isNeg = row.value < 0
                return (
                  <tr key={i} style={{
                    borderBottom: `1px solid ${PRINT_TOKENS.borderLight}`,
                    background: row.bold ? PRINT_TOKENS.primaryBg : 'white',
                  }}>
                    <td style={{
                      padding: '7px 16px',
                      fontSize: '14px',
                      color: row.bold ? PRINT_TOKENS.primary : PRINT_TOKENS.textSecondary,
                      fontWeight: row.bold ? 700 : 400,
                      paddingLeft: row.indent ? '28px' : '16px',
                    }}>
                      {row.label}
                    </td>
                    <td style={{
                      padding: '7px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: row.bold ? 700 : 400,
                      color: isNeg ? PRINT_TOKENS.danger : row.bold ? PRINT_TOKENS.primary : PRINT_TOKENS.textPrimary,
                      whiteSpace: 'nowrap',
                    }}>
                      {isNeg ? `△ ${formatNumber(Math.abs(row.value))}` : formatNumber(row.value)}
                      <span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '2px', color: PRINT_TOKENS.textTertiary }}>원</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PageFooter pageNumber={2} totalPages={5} />
    </div>
  )
}
