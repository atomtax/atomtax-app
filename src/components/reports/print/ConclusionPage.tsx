import {
  PRINT_TOKENS, a4LastPageStyle,
  ChapterHeader, PageFooter,
  formatNumber, toBillionWon, safePercentage,
} from './CorporateTaxPrintTokens'
import { parseConclusion } from '@/lib/utils/conclusion-parser'
import type { IncomeStatementSummary } from '@/types/database'

interface Props {
  reportYear: number
  summary: IncomeStatementSummary | null
  finalTax: number
  determinedTax: number
  totalCredits: number
  totalReductions: number
  conclusionNotes: string | null
  additionalNotes: string | null
  isSincerefiling: boolean
}

export function ConclusionPage({
  reportYear,
  summary,
  finalTax,
  totalCredits,
  totalReductions,
  conclusionNotes,
  additionalNotes,
  isSincerefiling,
}: Props) {
  const points = parseConclusion(conclusionNotes)
  const effectiveTaxRate = safePercentage(finalTax, summary?.pretax_income)
  const totalBenefit = totalCredits + totalReductions

  const keyMetrics = [
    {
      label: '최종 납부세액',
      value: `${formatNumber(finalTax)}원`,
      sub: toBillionWon(finalTax),
      bg: PRINT_TOKENS.primary,
    },
    {
      label: '실효세율',
      value: effectiveTaxRate === '—' ? '—' : `${effectiveTaxRate}%`,
      sub: '최종세액 ÷ 법인세차감전이익',
      bg: PRINT_TOKENS.primaryMid,
    },
    {
      label: '공제·감면 혜택',
      value: `${formatNumber(totalBenefit)}원`,
      sub: '공제 + 감면 합계',
      bg: PRINT_TOKENS.primaryLight,
    },
  ]

  return (
    <div className="page-container" style={a4LastPageStyle}>
      <ChapterHeader number="05" titleKo="종합 결론" titleEn="CONCLUSION & SUMMARY" reportYear={reportYear} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: 0, whiteSpace: 'nowrap' }}>{value}</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* 성실신고 배지 */}
        {isSincerefiling && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px',
            background: PRINT_TOKENS.bgSecondary,
            border: `1px solid ${PRINT_TOKENS.border}`,
            borderRadius: '100px',
            alignSelf: 'flex-start',
          }}>
            <div style={{
              width: '6px', height: '6px',
              background: PRINT_TOKENS.success,
              borderRadius: '50%',
            }} />
            <span style={{ fontSize: '13px', color: PRINT_TOKENS.textSecondary, fontWeight: 600 }}>
              성실신고 확인 대상
            </span>
          </div>
        )}

        {/* 결론 카드 */}
        {points.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: points.length === 1 ? '1fr' : points.length === 2 ? '1fr 1fr' : points.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: '10px',
          }}>
            {points.map((point, i) => (
              <div key={i} style={{
                border: `1px solid ${PRINT_TOKENS.border}`,
                borderRadius: '8px',
                padding: '14px 16px',
                borderTop: `3px solid ${PRINT_TOKENS.primaryAccent}`,
                WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
              } as React.CSSProperties}>
                {point.title && (
                  <p style={{
                    fontSize: '14px', fontWeight: 700,
                    color: PRINT_TOKENS.primary,
                    margin: '0 0 6px',
                  }}>
                    {point.title}
                  </p>
                )}
                {point.body && (
                  <p style={{
                    fontSize: '14px',
                    color: PRINT_TOKENS.textSecondary,
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
                    {point.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 추가 메모 */}
        {additionalNotes && additionalNotes.trim() && (
          <div style={{
            background: PRINT_TOKENS.bgSubtle,
            border: `1px solid ${PRINT_TOKENS.borderLight}`,
            borderRadius: '6px',
            padding: '12px 16px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textTertiary, margin: '0 0 6px', letterSpacing: '0.4px' }}>ADDITIONAL NOTES</p>
            <p style={{ fontSize: '14px', color: PRINT_TOKENS.textSecondary, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {additionalNotes}
            </p>
          </div>
        )}

        {/* 안내 박스 */}
        <div style={{
          background: `linear-gradient(135deg, ${PRINT_TOKENS.primaryBg} 0%, white 100%)`,
          borderRadius: '8px', padding: '14px 18px',
          border: `1px solid ${PRINT_TOKENS.primaryBgPill}`,
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          marginTop: 'auto',
          WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
        } as React.CSSProperties}>
          <div style={{
            width: '22px', height: '22px', background: PRINT_TOKENS.primary,
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, marginTop: '1px',
          }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>A</span>
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: PRINT_TOKENS.primary, margin: '0 0 3px' }}>
              아톰세무회계 — {reportYear}년 법인세 신고 완료
            </p>
            <p style={{ fontSize: '13px', color: PRINT_TOKENS.textSecondary, margin: 0, lineHeight: 1.5 }}>
              본 보고서는 {reportYear}사업연도 법인세 신고 결과를 요약한 것으로, 담당 세무사의 검토를 거쳐 작성되었습니다.
              궁금한 사항은 아톰세무회계로 문의하시기 바랍니다.
            </p>
          </div>
        </div>
      </div>

      <PageFooter pageNumber={5} />
    </div>
  )
}
