import {
  PRINT_TOKENS, a4PageStyle,
  ChapterHeader, PageFooter,
  formatNumber,
} from '@/components/reports/print/CorporateTaxPrintTokens'
import type { TaxCredit, TaxReduction } from '@/types/database'

interface Props {
  reportYear: number
  taxCredits: TaxCredit[]
  taxReductions: TaxReduction[]
  chapterNumber?: string
  pageNumber?: number
  totalPages?: number
}

export function IncomeTaxCreditsPage({
  reportYear,
  taxCredits,
  taxReductions,
  chapterNumber = '04',
  pageNumber = 4,
  totalPages = 5,
}: Props) {
  const creditTotal = taxCredits.reduce((s, c) => s + (c.current_amount ?? 0) + (c.carryover_amount ?? 0), 0)
  const reductionTotal = taxReductions.reduce((s, r) => s + (r.current_amount ?? 0), 0)
  const ruralTax = Math.floor(reductionTotal * 0.2)

  const noData = taxCredits.length === 0 && taxReductions.length === 0

  return (
    <div className="page-container" style={a4PageStyle}>
      <ChapterHeader number={chapterNumber} titleKo="세액공제·감면" titleEn="TAX CREDITS & REDUCTIONS" reportYear={reportYear} />

      {/* 안내 박스 */}
      <div style={{
        marginBottom: '16px',
        padding: '14px 18px',
        background: PRINT_TOKENS.primaryBg,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      } as React.CSSProperties}>
        <div style={{
          flexShrink: 0,
          width: '24px',
          height: '24px',
          background: PRINT_TOKENS.primary,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 700,
        }}>
          ✓
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.primary, margin: '0 0 4px' }}>
            아톰세무회계 정책
          </p>
          <p style={{ fontSize: '13px', color: PRINT_TOKENS.textSecondary, margin: 0, lineHeight: 1.6 }}>
            아톰세무회계는 적용 가능한 <strong>세액공제·감면을 최대한 적용</strong>하여 고객님의 세 부담을 최소화합니다.
          </p>
        </div>
      </div>

      {noData ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px dashed ${PRINT_TOKENS.border}`, borderRadius: '8px',
        }}>
          <p style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary }}>세액공제·감면 항목 없음</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: '세액공제 합계', value: creditTotal, bg: PRINT_TOKENS.primary },
              { label: '세액감면 합계', value: reductionTotal, bg: PRINT_TOKENS.primaryMid },
              { label: '농어촌특별세 (감면액 20%)', value: ruralTax, bg: PRINT_TOKENS.primaryLight },
            ].map(({ label, value, bg }) => (
              <div key={label} style={{
                background: bg, borderRadius: '8px', padding: '14px 16px',
                WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
              } as React.CSSProperties}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>
                  {formatNumber(value)}<span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '2px' }}>원</span>
                </p>
              </div>
            ))}
          </div>

          {/* 세액공제 테이블 */}
          {taxCredits.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px',
                background: PRINT_TOKENS.bgSecondary,
                borderBottom: `1px solid ${PRINT_TOKENS.border}`,
                borderRadius: '6px 6px 0 0',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <div style={{ width: '4px', height: '14px', background: PRINT_TOKENS.primaryAccent, borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary }}>세액공제</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${PRINT_TOKENS.border}`, borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
                <thead>
                  <tr style={{ background: PRINT_TOKENS.bgSubtle }}>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary }}>공제 구분</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '130px' }}>당기 공제액</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '130px' }}>이월 공제액</th>
                  </tr>
                </thead>
                <tbody>
                  {taxCredits.map((credit, i) => {
                    const name = credit.type === '직접 입력' ? (credit.custom_name || credit.type) : credit.type
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${PRINT_TOKENS.borderLight}` }}>
                        <td style={{ padding: '7px 12px', fontSize: '14px', color: PRINT_TOKENS.textPrimary }}>{name}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: credit.current_amount > 0 ? PRINT_TOKENS.primary : PRINT_TOKENS.textMuted, whiteSpace: 'nowrap' }}>
                          {credit.current_amount > 0 ? `${formatNumber(credit.current_amount)}원` : '—'}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: '14px', color: credit.carryover_amount > 0 ? PRINT_TOKENS.textSecondary : PRINT_TOKENS.textMuted, whiteSpace: 'nowrap' }}>
                          {credit.carryover_amount > 0 ? `${formatNumber(credit.carryover_amount)}원` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                  <tr style={{ background: PRINT_TOKENS.primaryBg, borderTop: `1px solid ${PRINT_TOKENS.border}`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
                    <td style={{ padding: '7px 12px', fontSize: '14px', fontWeight: 700, color: PRINT_TOKENS.primary }}>합계</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: PRINT_TOKENS.primary, whiteSpace: 'nowrap' }}>
                      {formatNumber(taxCredits.reduce((s, c) => s + (c.current_amount ?? 0), 0))}원
                    </td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: PRINT_TOKENS.primary, whiteSpace: 'nowrap' }}>
                      {formatNumber(taxCredits.reduce((s, c) => s + (c.carryover_amount ?? 0), 0))}원
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 세액감면 테이블 */}
          {taxReductions.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px',
                background: PRINT_TOKENS.bgSecondary,
                borderBottom: `1px solid ${PRINT_TOKENS.border}`,
                borderRadius: '6px 6px 0 0',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <div style={{ width: '4px', height: '14px', background: PRINT_TOKENS.primaryMid, borderRadius: '2px' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary }}>세액감면</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${PRINT_TOKENS.border}`, borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
                <thead>
                  <tr style={{ background: PRINT_TOKENS.bgSubtle }}>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary }}>감면 구분</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textSecondary, width: '160px' }}>감면액</th>
                  </tr>
                </thead>
                <tbody>
                  {taxReductions.map((reduction, i) => {
                    const name = reduction.type === '직접 입력' ? (reduction.custom_name || reduction.type) : reduction.type
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${PRINT_TOKENS.borderLight}` }}>
                        <td style={{ padding: '7px 12px', fontSize: '14px', color: PRINT_TOKENS.textPrimary }}>{name}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: PRINT_TOKENS.primary, whiteSpace: 'nowrap' }}>
                          {formatNumber(reduction.current_amount)}원
                        </td>
                      </tr>
                    )
                  })}
                  <tr style={{ background: PRINT_TOKENS.primaryBg, borderTop: `1px solid ${PRINT_TOKENS.border}`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
                    <td style={{ padding: '7px 12px', fontSize: '14px', fontWeight: 700, color: PRINT_TOKENS.primary }}>합계</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: PRINT_TOKENS.primary, whiteSpace: 'nowrap' }}>
                      {formatNumber(reductionTotal)}원
                    </td>
                  </tr>
                </tbody>
              </table>
              {/* 농어촌특별세 안내 */}
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: PRINT_TOKENS.bgSubtle,
                border: `1px solid ${PRINT_TOKENS.borderLight}`,
                borderRadius: '4px',
                fontSize: '13px',
                color: PRINT_TOKENS.textTertiary,
              }}>
                * 감면액 {formatNumber(reductionTotal)}원의 20% = 농어촌특별세 {formatNumber(ruralTax)}원 부과
              </div>
            </div>
          )}
        </div>
      )}

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />

    </div>
  )
}
