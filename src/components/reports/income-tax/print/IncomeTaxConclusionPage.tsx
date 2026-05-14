import {
  PRINT_TOKENS, a4LastPageStyle,
  ChapterHeader, PageFooter,
  formatNumber, toBillionWon,
} from '@/components/reports/print/CorporateTaxPrintTokens'
import { highlightAmounts } from '@/lib/utils/highlight-amounts'
import { parseIncomeTaxConclusion } from '@/lib/utils/income-tax-conclusion-parser'
import type { IncomeTaxReport } from '@/types/database'

interface Props {
  reportYear: number
  report: IncomeTaxReport
  chapterNumber?: string
  pageNumber?: number
  totalPages?: number
}

export function IncomeTaxConclusionPage({
  reportYear,
  report,
  chapterNumber = '05',
  pageNumber = 5,
  totalPages = 5,
}: Props) {
  const finalWithLocal = report.income_final_with_local
  const isRefund = finalWithLocal < 0
  const creditTotal = report.tax_credits.reduce((s, c) => s + (c.current_amount ?? 0) + (c.carryover_amount ?? 0), 0)
  const reductionTotal = report.tax_reductions.reduce((s, r) => s + (r.current_amount ?? 0), 0)
  const totalBenefit = creditTotal + reductionTotal

  const { cards, closing } = parseIncomeTaxConclusion(report.conclusion_notes)

  const keyMetrics = [
    {
      label: isRefund ? '환급 세액 (지방세 포함)' : '최종 납부세액 (지방세 포함)',
      value: `${formatNumber(Math.abs(finalWithLocal))}원`,
      sub: toBillionWon(Math.abs(finalWithLocal)),
      bg: isRefund ? PRINT_TOKENS.successDark : PRINT_TOKENS.primary,
    },
    {
      label: '결정세액 합계',
      value: `${formatNumber(report.income_determined_total)}원`,
      sub: toBillionWon(report.income_determined_total),
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
      <ChapterHeader number={chapterNumber} titleKo="종합 결론" titleEn="CONCLUSION & SUMMARY" reportYear={reportYear} />

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
        {report.is_sincere_filing && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px',
            background: PRINT_TOKENS.bgSecondary,
            border: `1px solid ${PRINT_TOKENS.border}`,
            borderRadius: '100px',
            alignSelf: 'flex-start',
          }}>
            <div style={{ width: '6px', height: '6px', background: PRINT_TOKENS.success, borderRadius: '50%' }} />
            <span style={{ fontSize: '13px', color: PRINT_TOKENS.textSecondary, fontWeight: 600 }}>
              성실신고 확인 대상
            </span>
          </div>
        )}

        {/* 결론 카드 (최대 4개, "마무리 인사" 제외) */}
        {cards.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: cards.length === 1 ? '1fr' : cards.length === 2 ? '1fr 1fr' : cards.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: '10px',
          }}>
            {cards.map((point, i) => (
              <div key={i} style={{
                border: `1px solid ${PRINT_TOKENS.border}`,
                borderRadius: '8px',
                padding: '14px 16px',
                borderTop: `3px solid ${PRINT_TOKENS.primaryAccent}`,
                WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
              } as React.CSSProperties}>
                {point.title && (
                  <p style={{ fontSize: '14px', fontWeight: 700, color: PRINT_TOKENS.primary, margin: '0 0 6px' }}>
                    {point.title}
                  </p>
                )}
                {point.body && (
                  <p style={{ fontSize: '13px', color: PRINT_TOKENS.textSecondary, margin: 0, lineHeight: 1.6 }}>
                    {highlightAmounts(point.body)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 추가 메모 */}
        {report.additional_notes && report.additional_notes.trim() && (
          <div style={{
            background: PRINT_TOKENS.bgSubtle,
            border: `1px solid ${PRINT_TOKENS.borderLight}`,
            borderRadius: '6px',
            padding: '12px 16px',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: PRINT_TOKENS.textTertiary, margin: '0 0 6px', letterSpacing: '0.4px' }}>ADDITIONAL NOTES</p>
            <p style={{ fontSize: '13px', color: PRINT_TOKENS.textSecondary, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {report.additional_notes}
            </p>
          </div>
        )}

        {/* 진파랑 박스 — 인사말 + 기존 안내 */}
        <div style={{
          marginTop: 'auto',
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          color: 'white',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        } as React.CSSProperties}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'relative' }}>
            {/* 인사말 (자동 생성 시) */}
            {closing && (
              <>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'white', margin: '0 0 14px', lineHeight: 1.7 }}>
                  {highlightAmounts(closing, { color: '#fef3c7' })}
                </p>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 0 12px' }} />
              </>
            )}
            {/* 기존 안내 — 항상 표시 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{
                width: '22px', height: '22px', background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>A</span>
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', margin: '0 0 3px' }}>
                  아톰세무회계 — {reportYear}년 종합소득세 신고 완료
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
                  본 보고서는 {reportYear}년도 종합소득세 신고 결과를 요약한 것으로, 담당 세무사의 검토를 거쳐 작성되었습니다.
                  궁금한 사항은 아톰세무회계로 문의하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  )
}
