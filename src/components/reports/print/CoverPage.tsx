import { PRINT_TOKENS, a4PageStyle } from './CorporateTaxPrintTokens'

interface Props {
  client: {
    company_name: string
    business_type?: string
    business_number: string | null
  }
  reportYear: number
}

export function CoverPage({ client, reportYear }: Props) {
  return (
    <div className="page-container" style={a4PageStyle}>
      {/* ── 상단 그라디언트 헤더 ── */}
      <div style={{
        margin: '-20mm -18mm 0',
        height: '96mm',
        background: `linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #2563eb 100%)`,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 18mm 12mm',
      } as React.CSSProperties}>
        {/* 격자 패턴 SVG */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* 원형 데코 */}
        <div style={{
          position: 'absolute', top: '-30mm', right: '-20mm',
          width: '80mm', height: '80mm',
          background: 'rgba(255,255,255,0.06)', borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', top: '10mm', right: '10mm',
          width: '40mm', height: '40mm',
          background: 'rgba(255,255,255,0.04)', borderRadius: '50%',
        }} />

        {/* FY 라벨 */}
        <div style={{
          position: 'absolute', top: '10mm', left: '18mm',
          display: 'inline-flex', alignItems: 'center',
          padding: '4px 12px',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '100px',
        }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, letterSpacing: '1.2px' }}>
            FY {reportYear} ANNUAL REPORT
          </span>
        </div>

        {/* 메인 제목 */}
        <h1 style={{
          fontSize: '44px',
          fontWeight: 600,
          color: 'white',
          margin: '0 0 6px',
          letterSpacing: '-1px',
          lineHeight: 1.15,
          position: 'relative',
          zIndex: 1,
        }}>
          법인세 신고결과 보고서
        </h1>
      </div>

      {/* ── 본문 영역 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '14mm', gap: '14mm' }}>

        {/* 회사명 카드 */}
        <div style={{
          border: `1px solid ${PRINT_TOKENS.border}`,
          borderRadius: '8px',
          padding: '20px 24px',
          background: PRINT_TOKENS.bgSubtle,
        }}>
          <p style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary, margin: '0 0 8px', fontWeight: 500, letterSpacing: '0.4px' }}>
            CLIENT
          </p>
          <h2 style={{
            fontSize: '30px', fontWeight: 700, color: PRINT_TOKENS.textPrimary,
            margin: '0 0 8px', letterSpacing: '-0.5px',
          }}>
            {client.company_name}
          </h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {client.business_type && (
              <span style={{ fontSize: '16px', color: PRINT_TOKENS.textSecondary, fontWeight: 500 }}>
                {client.business_type}
              </span>
            )}
            {client.business_number && (
              <span style={{ fontSize: '16px', color: PRINT_TOKENS.textSecondary }}>
                사업자번호: {client.business_number}
              </span>
            )}
          </div>
        </div>

        {/* 메타 2분할 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: '사업연도', value: `${reportYear}년도` },
            { label: '담당 세무사', value: '김경태 대표세무사' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              border: `1px solid ${PRINT_TOKENS.borderLight}`,
              borderRadius: '6px',
              padding: '18px 20px',
            }}>
              <p style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary, margin: '0 0 6px', fontWeight: 500, letterSpacing: '0.4px' }}>
                {label.toUpperCase()}
              </p>
              <p style={{ fontSize: '20px', fontWeight: 600, color: PRINT_TOKENS.textPrimary, margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 푸터 ── */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '6mm',
        borderTop: `1px solid ${PRINT_TOKENS.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '13px', color: PRINT_TOKENS.textTertiary, fontWeight: 600, letterSpacing: '1px' }}>
          CONFIDENTIAL
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: PRINT_TOKENS.primary,
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>A</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: PRINT_TOKENS.textPrimary, margin: 0 }}>
              아톰세무회계
            </p>
            <p style={{ fontSize: '13px', fontWeight: 500, color: PRINT_TOKENS.textTertiary, margin: '2px 0 0', letterSpacing: '1.5px' }}>
              ATOM TAX ACCOUNTING
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
