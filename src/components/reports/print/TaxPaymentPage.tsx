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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* ─ 최종세액 Hero 카드 ─ */}
        <div style={{
          background: `linear-gradient(135deg, ${PRINT_TOKENS.successDark} 0%, ${PRINT_TOKENS.success} 100%)`,
          borderRadius: '10px', padding: '20px 24px',
          position: 'relative', overflow: 'hidden',
          WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
        } as React.CSSProperties}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '10px', right: '40px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 8px', fontWeight: 600, letterSpacing: '1px' }}>
            FINAL TAX PAYABLE · 최종 납부할 세액
          </p>
          <p style={{ fontSize: '44px', fontWeight: 700, color: 'white', margin: '0 0 6px', letterSpacing: '-1px' }}>
            {formatNumber(finalTax)}
            <span style={{ fontSize: '20px', fontWeight: 400, marginLeft: '4px', opacity: 0.9 }}>원</span>
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: '0 0 2px' }}>
            {toBillionWon(finalTax)}
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            결정세액 + 지방소득세 + 농어촌특별세 − 기납부세액
          </p>
        </div>

        {/* ─ 세금 흐름 다이어그램 (SVG) ─ */}
        <div style={{
          border: `1px solid ${PRINT_TOKENS.border}`,
          borderRadius: '8px', padding: '14px 16px',
        }}>
          <p style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary, margin: '0 0 10px', fontWeight: 600, letterSpacing: '0.4px' }}>
            TAX FLOW
          </p>
          <svg width="100%" viewBox="0 0 480 82" style={{ display: 'block', overflow: 'visible' }}>
            <defs>
              <linearGradient id="finalTaxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={PRINT_TOKENS.successDark} />
                <stop offset="100%" stopColor={PRINT_TOKENS.success} />
              </linearGradient>
            </defs>
            {/* 1. 산출세액 */}
            <rect x="0" y="18" width="62" height="42" fill={PRINT_TOKENS.primaryDark} rx="3"
              style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties} />
            <text x="31" y="34" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.9)" letterSpacing="0.4" fontWeight="500">산출세액</text>
            <text x="31" y="51" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">{toBillionWon(calculatedTax)}</text>
            {/* − */}
            <text x="70" y="44" fontSize="14" fill={PRINT_TOKENS.textTertiary} fontWeight="600">−</text>
            {/* 2. 공제·감면 */}
            <rect x="80" y="18" width="62" height="42" fill={PRINT_TOKENS.primaryLight} rx="3"
              style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties} />
            <text x="111" y="34" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.9)" letterSpacing="0.4" fontWeight="500">공제·감면</text>
            <text x="111" y="51" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">{toBillionWon(totalDeductions)}</text>
            {/* + */}
            <text x="150" y="44" fontSize="14" fill={PRINT_TOKENS.textTertiary} fontWeight="600">+</text>
            {/* 3. 지방·농특세 */}
            <rect x="160" y="18" width="62" height="42" fill={PRINT_TOKENS.primaryAccent} rx="3"
              style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties} />
            <text x="191" y="34" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.9)" letterSpacing="0.4" fontWeight="500">지방·농특세</text>
            <text x="191" y="51" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">{toBillionWon(additionalTax)}</text>
            {/* − */}
            <text x="230" y="44" fontSize="14" fill={PRINT_TOKENS.textTertiary} fontWeight="600">−</text>
            {/* 4. 기납부세액 (흰 글자) */}
            <rect x="240" y="18" width="62" height="42" fill={PRINT_TOKENS.primarySoft} rx="3"
              style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties} />
            <text x="271" y="34" textAnchor="middle" fontSize="10" fill="white" opacity="0.95" letterSpacing="0.4" fontWeight="500">기납부</text>
            <text x="271" y="51" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">{toBillionWon(prepaidTax)}</text>
            {/* = */}
            <text x="310" y="44" fontSize="14" fill={PRINT_TOKENS.textTertiary} fontWeight="600">=</text>
            {/* 5. 최종세액 (초록 강조, 폭 넓게) */}
            <rect x="320" y="12" width="160" height="56" fill="url(#finalTaxGradient)" rx="4"
              style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties} />
            <text x="400" y="30" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.9)" letterSpacing="0.5" fontWeight="500">최종세액</text>
            <text x="400" y="52" textAnchor="middle" fontSize="16" fontWeight="700" fill="white">{toBillionWon(finalTax)}</text>
            {/* 단위 */}
            <text x="0" y="78" fontSize="10" fill={PRINT_TOKENS.textTertiary}>단위: 억원</text>
          </svg>
        </div>

        {/* ─ 6분할 그리드 ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {gridItems.map(({ label, value, sub }) => (
            <div key={label} style={{
              border: `1px solid ${PRINT_TOKENS.border}`,
              borderRadius: '6px', padding: '14px 16px',
            }}>
              <p style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary, margin: '0 0 2px', fontWeight: 500 }}>{label}</p>
              <p style={{ fontSize: '13px', color: PRINT_TOKENS.textMuted, margin: '0 0 8px' }}>{sub}</p>
              <p style={{ fontSize: '19px', fontWeight: 600, color: PRINT_TOKENS.textPrimary, margin: 0, whiteSpace: 'nowrap' }}>
                {formatNumber(value)}<span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '2px' }}>원</span>
              </p>
            </div>
          ))}

          {/* 최종세액 강조 칸 */}
          <div style={{
            background: PRINT_TOKENS.primaryBg,
            borderRadius: '6px', padding: '14px 16px',
            border: `1px solid ${PRINT_TOKENS.primaryBgPill}`,
            WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
          } as React.CSSProperties}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <div style={{ width: '4px', height: '4px', background: PRINT_TOKENS.primary, borderRadius: '50%', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: PRINT_TOKENS.primary, margin: 0, letterSpacing: '0.4px', fontWeight: 600 }}>
                  최종세액
                </p>
              </div>
              <p style={{ fontSize: '12px', color: PRINT_TOKENS.primary, margin: 0, fontWeight: 500, whiteSpace: 'nowrap' }}>
                실효세율 <span style={{ fontSize: '14px', fontWeight: 600 }}>{effectiveTaxRate}%</span>
              </p>
            </div>
            <p style={{ fontSize: '20px', fontWeight: 600, color: PRINT_TOKENS.primary, margin: 0, whiteSpace: 'nowrap' }}>
              {formatNumber(finalTax)}<span style={{ fontSize: '12px', fontWeight: 400, marginLeft: '3px' }}>원</span>
            </p>
            <p style={{ fontSize: '11px', color: PRINT_TOKENS.textSecondary, margin: '4px 0 0' }}>
              실효세율 = 최종세액 ÷ 법인세차감전이익
            </p>
          </div>
        </div>
      </div>

      <PageFooter pageNumber={2} />
    </div>
  )
}
