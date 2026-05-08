import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  toBillionWon, safePercentage, formatNumber,
} from './CorporateTaxPrintTokens'

interface Props {
  reportYear: number
  calculatedTax: number
  determinedTax: number
  localTax: number
  ruralSpecialTax: number
  prepaidTax: number
  finalTax: number
  pretaxIncome: number | null
}

export function TaxPaymentPage({
  reportYear,
  calculatedTax,
  determinedTax,
  localTax,
  ruralSpecialTax,
  prepaidTax,
  finalTax,
  pretaxIncome,
}: Props) {
  const effectiveTaxRate = safePercentage(finalTax, pretaxIncome)
  const totalDeductions = calculatedTax - determinedTax
  const additionalTax = localTax + ruralSpecialTax

  // 흐름 다이어그램 박스 데이터
  const flowBoxes = [
    { label: '산출세액', value: calculatedTax, bg: PRINT_TOKENS.primaryDark, textColor: 'white' },
    { label: '공제·감면', value: totalDeductions, bg: PRINT_TOKENS.primaryLight, textColor: 'white' },
    { label: '지방·농특세', value: additionalTax, bg: PRINT_TOKENS.primaryAccent, textColor: 'white' },
    { label: '기납부세액', value: prepaidTax, bg: PRINT_TOKENS.primarySoft, textColor: PRINT_TOKENS.textPrimary },
  ]
  const flowOps = ['−', '+', '−']

  // 6분할 그리드 데이터 (5개 + 통합 칸)
  const gridItems = [
    { label: '산출세액', value: calculatedTax, sub: '과세표준 × 세율' },
    { label: '결정세액', value: determinedTax, sub: '산출세액 − 공제/감면' },
    { label: '지방소득세', value: localTax, sub: '결정세액 × 10%' },
    { label: '농어촌특별세', value: ruralSpecialTax, sub: '감면액 × 20%' },
    { label: '기납부세액', value: prepaidTax, sub: '중간예납 등' },
  ]

  return (
    <div className="page-container" style={a4PageStyle}>
      <ChapterHeader number="02" titleKo="세금 납부" titleEn="TAX PAYMENT & REFUND" reportYear={reportYear} />

      {/* ─ 최종세액 Hero 카드 ─ */}
      <div style={{
        background: `linear-gradient(135deg, ${PRINT_TOKENS.successDark} 0%, ${PRINT_TOKENS.success} 100%)`,
        borderRadius: '10px', padding: '20px 24px',
        position: 'relative', overflow: 'hidden', marginBottom: '20px',
        WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
      } as React.CSSProperties}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '10px', right: '40px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', margin: '0 0 8px', fontWeight: 600, letterSpacing: '1px' }}>
          FINAL TAX PAYABLE · 최종 납부할 세액
        </p>
        <p style={{ fontSize: '30px', fontWeight: 700, color: 'white', margin: '0 0 6px', letterSpacing: '-1px' }}>
          {formatNumber(finalTax)}
          <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px', opacity: 0.9 }}>원</span>
        </p>
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', margin: '0 0 2px' }}>
          {toBillionWon(finalTax)} 억원
        </p>
        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
          결정세액 + 지방소득세 + 농어촌특별세 − 기납부세액
        </p>
      </div>

      {/* ─ 세금 흐름 다이어그램 ─ */}
      <div style={{
        border: `1px solid ${PRINT_TOKENS.border}`,
        borderRadius: '8px', padding: '14px 16px', marginBottom: '16px',
      }}>
        <p style={{ fontSize: '9px', color: PRINT_TOKENS.textTertiary, margin: '0 0 10px', fontWeight: 600, letterSpacing: '0.4px' }}>
          TAX FLOW
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {flowBoxes.map(({ label, value, bg, textColor }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: i < flowBoxes.length - 1 ? '1' : '1' }}>
              <div style={{
                flex: 1, background: bg, borderRadius: '5px', padding: '8px 10px',
                WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
              } as React.CSSProperties}>
                <p style={{ fontSize: '8px', color: textColor === 'white' ? 'rgba(255,255,255,0.85)' : PRINT_TOKENS.textTertiary, margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: '10px', fontWeight: 600, color: textColor, margin: 0, whiteSpace: 'nowrap' }}>
                  {formatNumber(value)}원
                </p>
              </div>
              {i < flowOps.length && (
                <span style={{ fontSize: '14px', fontWeight: 600, color: PRINT_TOKENS.textTertiary, flexShrink: 0 }}>
                  {flowOps[i]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─ 6분할 그리드 ─ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {gridItems.map(({ label, value, sub }) => (
          <div key={label} style={{
            border: `1px solid ${PRINT_TOKENS.border}`,
            borderRadius: '6px', padding: '12px 14px',
          }}>
            <p style={{ fontSize: '9px', color: PRINT_TOKENS.textTertiary, margin: '0 0 2px', fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: '9px', color: PRINT_TOKENS.textMuted, margin: '0 0 6px' }}>{sub}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textPrimary, margin: 0, whiteSpace: 'nowrap' }}>
              {formatNumber(value)}<span style={{ fontSize: '9px', fontWeight: 400, marginLeft: '2px' }}>원</span>
            </p>
          </div>
        ))}

        {/* 마지막 통합 칸 — 강조선 없음, 점 강조 */}
        <div style={{
          background: PRINT_TOKENS.primaryBg,
          borderRadius: '6px', padding: '12px 14px',
          border: `1px solid ${PRINT_TOKENS.primaryBgPill}`,
          WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
        } as React.CSSProperties}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '4px', height: '4px',
                background: PRINT_TOKENS.primary,
                borderRadius: '50%',
                flexShrink: 0,
              }} />
              <p style={{ fontSize: '9px', color: PRINT_TOKENS.primary, margin: 0, letterSpacing: '0.4px', fontWeight: 600 }}>
                최종 납부할 세액
              </p>
            </div>
            <p style={{ fontSize: '9px', color: PRINT_TOKENS.primary, margin: 0, fontWeight: 500 }}>
              실효세율&nbsp;
              <span style={{ fontSize: '11px', fontWeight: 700 }}>{effectiveTaxRate}%</span>
            </p>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: PRINT_TOKENS.primary, margin: 0, whiteSpace: 'nowrap' }}>
            {formatNumber(finalTax)}<span style={{ fontSize: '9px', fontWeight: 400, marginLeft: '3px' }}>원</span>
          </p>
          <p style={{ fontSize: '8px', color: PRINT_TOKENS.textSecondary, margin: '4px 0 0' }}>
            실효세율 = 최종세액 ÷ 법인세차감전이익
          </p>
        </div>
      </div>

      <PageFooter pageNumber={2} />
    </div>
  )
}
