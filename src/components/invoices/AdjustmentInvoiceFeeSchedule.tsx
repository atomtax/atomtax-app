import { OFFICE } from '@/lib/constants/office'
import { FEE_SCHEDULE_TABLE } from '@/lib/calculators/fee-schedule'
import A4Page from '@/components/print/A4Page'

export default function AdjustmentInvoiceFeeSchedule() {
  return (
    <A4Page>
      {/* 상단 색상 바 */}
      <div
        style={{
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          height: '6px',
          marginLeft: '-15mm',
          marginRight: '-15mm',
          marginTop: '-15mm',
          marginBottom: '32px',
          width: 'calc(100% + 30mm)',
        }}
      />

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#6b7280', marginBottom: '4px' }}>
            FEE SCHEDULE
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            조정료 산정 기준표
          </h1>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>
            수입금액(정부지원금 포함)에 따른 보수기준
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={OFFICE.nameplateImage}
            alt={OFFICE.name}
            style={{ height: '60px', width: 'auto', maxWidth: '220px', objectFit: 'contain' }}
            onError={(e) => {
              const el = e.currentTarget
              el.style.display = 'none'
              const fallback = el.nextElementSibling as HTMLElement
              if (fallback) fallback.style.display = 'block'
            }}
          />
          <div style={{ display: 'none', fontSize: '18px', fontWeight: 'bold', background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {OFFICE.name}
          </div>
        </div>
      </div>

      {/* 안내 박스 */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '14px 20px',
        marginBottom: '24px',
        fontSize: '12px',
        color: '#4b5563',
        lineHeight: '1.8',
      }}>
        <strong style={{ color: '#0f172a' }}>산정 기준 안내</strong><br />
        · 수입금액은 정부지원금(보조금 등)을 포함한 금액입니다.<br />
        · 조정료는 해당 구간의 기본금액에 초과분에 요율을 적용하여 산출합니다.<br />
        · 세액공제 추가, 성실신고 확인료, 할인은 별도 적용됩니다.
      </div>

      {/* 기준표 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: 'white' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '500' }}>수입금액 구간</th>
            <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', fontWeight: '500', width: '230px' }}>법인·의료사업자</th>
            <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', fontWeight: '500', width: '200px' }}>개인사업자</th>
          </tr>
        </thead>
        <tbody>
          {FEE_SCHEDULE_TABLE.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid #e2e8f0',
                background: i % 2 === 0 ? 'white' : '#f8fafc',
              }}
            >
              <td style={{ padding: '11px 16px', fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
                {row.range}
              </td>
              <td style={{ padding: '11px 16px', fontSize: '12px', color: '#374151', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {row.corporate}
              </td>
              <td style={{ padding: '11px 16px', fontSize: '12px', color: '#374151', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {row.individual}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 추가 항목 설명 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '8px' }}>TAX CREDIT · 세액공제</div>
          <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500', marginBottom: '4px' }}>세액공제 추가보수</div>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.7' }}>
            고용증대, 연구개발비, 중소기업 특별세액공제 등<br />
            세액공제 신청 시 별도 보수가 추가될 수 있습니다.
          </div>
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '8px' }}>FAITHFUL REPORT · 성실신고</div>
          <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500', marginBottom: '4px' }}>성실신고 확인료</div>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.7' }}>
            성실신고 확인 대상 사업자의 경우<br />
            성실신고 확인료가 별도로 청구됩니다.
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.8' }}>
          {OFFICE.name} · {OFFICE.representativeTitle} {OFFICE.representative}<br />
          {OFFICE.address} · T. {OFFICE.phone}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'right',
        }}>
          본 기준표는 {OFFICE.name} 내부 보수기준에 따릅니다.
        </div>
      </div>
    </A4Page>
  )
}
