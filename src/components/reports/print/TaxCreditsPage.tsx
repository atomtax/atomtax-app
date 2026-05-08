import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  formatNumber, toBillionWon,
} from './CorporateTaxPrintTokens'
import type { TaxCredit } from '@/types/database'

interface Props {
  reportYear: number
  taxCredits: TaxCredit[]
}

export function TaxCreditsPage({ reportYear, taxCredits }: Props) {
  const currentTotal = taxCredits.reduce((s, c) => s + (c.current_amount ?? 0), 0)
  const carryoverTotal = taxCredits.reduce((s, c) => s + (c.carryover_amount ?? 0), 0)
  const grandTotal = currentTotal + carryoverTotal

  const currentRatio = grandTotal > 0 ? currentTotal / grandTotal : 0
  const currentPct = (currentRatio * 100).toFixed(1)
  const carryoverPct = ((1 - currentRatio) * 100).toFixed(1)

  // 도넛 차트 계산
  const r = 68
  const circumference = 2 * Math.PI * r // ≈ 427.26
  const currentArc = currentRatio * circumference
  const carryoverArc = (1 - currentRatio) * circumference

  const isEmpty = grandTotal === 0

  return (
    <div style={a4PageStyle}>
      <ChapterHeader number="03" titleKo="세액공제" titleEn="TAX CREDITS" reportYear={reportYear} />

      {isEmpty ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px dashed ${PRINT_TOKENS.border}`, borderRadius: '8px',
        }}>
          <p style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary }}>세액공제 항목 없음</p>
        </div>
      ) : (
        <>
          {/* ─ 도넛 + 범례 ─ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* 도넛 차트 */}
            <div style={{
              border: `1px solid ${PRINT_TOKENS.border}`,
              borderRadius: '8px', padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 180 180" width="160" height="160" style={{ display: 'block', overflow: 'visible' }}>
                {/* 트랙 */}
                <circle cx="90" cy="90" r={r} fill="none"
                  stroke={PRINT_TOKENS.borderLight} strokeWidth="20" />
                {/* 당기 공제 (밝은 파랑) */}
                {currentArc > 0 && (
                  <circle cx="90" cy="90" r={r} fill="none"
                    stroke={PRINT_TOKENS.primaryAccent} strokeWidth="20"
                    strokeDasharray={`${currentArc} ${circumference}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 90 90)"
                    strokeLinecap="butt"
                    style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
                  />
                )}
                {/* 이월 공제 (진파랑) */}
                {carryoverArc > 0 && (
                  <circle cx="90" cy="90" r={r} fill="none"
                    stroke={PRINT_TOKENS.primary} strokeWidth="20"
                    strokeDasharray={`${carryoverArc} ${circumference}`}
                    strokeDashoffset={-currentArc}
                    transform="rotate(-90 90 90)"
                    strokeLinecap="butt"
                    style={{ WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
                  />
                )}
                {/* 중앙 텍스트 */}
                <text x="90" y="83" textAnchor="middle" fontSize="9" fill={PRINT_TOKENS.textTertiary} fontWeight="500">총 공제 가능</text>
                <text x="90" y="98" textAnchor="middle" fontSize="13" fill={PRINT_TOKENS.textPrimary} fontWeight="700">
                  {toBillionWon(grandTotal)}억
                </text>
              </svg>
            </div>

            {/* 범례 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              {/* 당기 공제 */}
              <div style={{
                background: PRINT_TOKENS.primaryBg, borderRadius: '6px',
                padding: '14px 16px', border: `1px solid ${PRINT_TOKENS.primaryBgPill}`,
                WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
              } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '10px', height: '10px', background: PRINT_TOKENS.primaryAccent, borderRadius: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '9px', color: PRINT_TOKENS.primary, fontWeight: 600 }}>당기 공제</span>
                  <span style={{ fontSize: '9px', color: PRINT_TOKENS.textTertiary, marginLeft: 'auto' }}>{currentPct}%</span>
                </div>
                <p style={{ fontSize: '18px', fontWeight: 700, color: PRINT_TOKENS.primary, margin: 0, whiteSpace: 'nowrap' }}>
                  {formatNumber(currentTotal)}<span style={{ fontSize: '10px', fontWeight: 400, marginLeft: '2px' }}>원</span>
                </p>
              </div>

              {/* 이월 공제 */}
              <div style={{
                border: `1px solid ${PRINT_TOKENS.border}`,
                borderRadius: '6px', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '10px', height: '10px', background: PRINT_TOKENS.primary, borderRadius: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '9px', color: PRINT_TOKENS.textTertiary, fontWeight: 600 }}>이월 공제</span>
                  <span style={{ fontSize: '9px', color: PRINT_TOKENS.textTertiary, marginLeft: 'auto' }}>{carryoverPct}%</span>
                </div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: PRINT_TOKENS.textPrimary, margin: 0, whiteSpace: 'nowrap' }}>
                  {formatNumber(carryoverTotal)}<span style={{ fontSize: '10px', fontWeight: 400, marginLeft: '2px' }}>원</span>
                </p>
              </div>
            </div>
          </div>

          {/* ─ 유형별 표 ─ */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
            <thead>
              <tr style={{ background: PRINT_TOKENS.bgSecondary, borderBottom: `1px solid ${PRINT_TOKENS.border}` }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 600, color: PRINT_TOKENS.textSecondary }}>공제 구분</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '140px' }}>당기 공제액</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '9px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '140px' }}>이월 공제액</th>
              </tr>
            </thead>
            <tbody>
              {taxCredits.map((credit, i) => {
                const name = credit.type === '직접 입력' ? (credit.custom_name || credit.type) : credit.type
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${PRINT_TOKENS.borderLight}` }}>
                    <td style={{ padding: '8px 12px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: PRINT_TOKENS.textPrimary, margin: 0 }}>{name}</p>
                      <p style={{ fontSize: '9px', color: PRINT_TOKENS.textTertiary, margin: '2px 0 0' }}>세액공제</p>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: credit.current_amount > 0 ? PRINT_TOKENS.primary : PRINT_TOKENS.textTertiary, whiteSpace: 'nowrap' }}>
                      {credit.current_amount > 0 ? `${formatNumber(credit.current_amount)}원` : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: PRINT_TOKENS.textSecondary, whiteSpace: 'nowrap' }}>
                      {credit.carryover_amount > 0 ? `${formatNumber(credit.carryover_amount)}원` : '—'}
                    </td>
                  </tr>
                )
              })}
              {/* 합계 행 */}
              <tr style={{ background: PRINT_TOKENS.primaryBg, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
                <td style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700, color: PRINT_TOKENS.primary }}>합계</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: PRINT_TOKENS.primary, whiteSpace: 'nowrap' }}>
                  {formatNumber(currentTotal)}원
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: PRINT_TOKENS.primary, whiteSpace: 'nowrap' }}>
                  {formatNumber(carryoverTotal)}원
                </td>
              </tr>
            </tbody>
          </table>

          {/* ─ 안내 박스 ─ */}
          {carryoverTotal > 0 && (
            <div style={{
              background: PRINT_TOKENS.primaryBg, borderRadius: '6px',
              padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start',
              border: `1px solid ${PRINT_TOKENS.primaryBgPill}`,
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
            } as React.CSSProperties}>
              <div style={{
                width: '18px', height: '18px', background: PRINT_TOKENS.primary,
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, marginTop: '1px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'white' }}>i</span>
              </div>
              <p style={{ fontSize: '10px', color: PRINT_TOKENS.textSecondary, margin: 0, lineHeight: 1.5 }}>
                이월공제액 <strong style={{ color: PRINT_TOKENS.primary }}>{formatNumber(carryoverTotal)}원</strong>은
                향후 <strong>10년간</strong> 이월하여 세액에서 공제 가능합니다.
              </p>
            </div>
          )}
        </>
      )}

      <PageFooter pageNumber={3} />
    </div>
  )
}
