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
          marginBottom: '20px',
          width: 'calc(100% + 30mm)',
        }}
      />

      {/* 헤더 */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#6b7280', marginBottom: '3px' }}>
          FEE SCHEDULE
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 5px', letterSpacing: '-0.5px' }}>
          조정료 산정 기준표
        </h1>
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          수입(자산)금액 기준 · 정부지원금 포함 · 단위: 원
        </div>
      </div>

      {/* 기준표 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: 'white' }}>
            <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: '500' }}>수입(자산)금액 구간</th>
            <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: '500', width: '225px' }}>법인 · 의료사업자</th>
            <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: '500', width: '205px' }}>개인사업자</th>
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
              <td style={{ padding: '8px 14px', color: '#0f172a', fontWeight: '500' }}>{row.range}</td>
              <td style={{ padding: '8px 14px', color: '#374151', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {row.corporate}
              </td>
              <td style={{ padding: '8px 14px', color: '#374151', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {row.individual}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 안내 사항 */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '18px',
        fontSize: '12px',
        color: '#4b5563',
        lineHeight: '1.9',
      }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '8px' }}>
          NOTES · 산정 안내
        </div>
        <div>• 본 산정표는 수입(자산)금액에 정부지원금을 포함하여 적용합니다.</div>
        <div>• 의료사업자는 법인사업자 기준을 따릅니다.</div>
        <div>• 산출 보수는 결산보수와 조정료로 1:1 분할되어 청구됩니다.</div>
        <div>• 성실신고 확인료, 세액공제 추가 보수는 별도로 산정됩니다.</div>
        <div>• 산정 결과는 청구 전 사전 협의가 가능합니다. 문의: {OFFICE.phone}</div>
      </div>

      {/* 푸터 */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', textAlign: 'center', fontSize: '10px', color: '#9ca3af' }}>
        {OFFICE.name} · {OFFICE.representativeTitle} {OFFICE.representative} · T. {OFFICE.phone}
      </div>
    </A4Page>
  )
}
