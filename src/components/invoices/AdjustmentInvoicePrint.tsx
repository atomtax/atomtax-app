import type { AdjustmentInvoice } from '@/types/database'
import { OFFICE } from '@/lib/constants/office'
import { formatCurrency, formatBusinessNumber } from '@/lib/utils/format'
import A4Page from '@/components/print/A4Page'

type Props = { invoice: AdjustmentInvoice }

function buildInvoiceNumber(year: number, id: string): string {
  const seq = parseInt(id.replace(/-/g, '').slice(0, 8), 16) % 1_000_000
  return `ADJ-${year}-${String(seq).padStart(6, '0')}`
}

export default function AdjustmentInvoicePrint({ invoice }: Props) {
  const issueYear = invoice.year ?? new Date(invoice.created_at).getFullYear()
  const invoiceNo = buildInvoiceNumber(issueYear, invoice.id)

  const subtotal =
    invoice.settlement_fee +
    invoice.adjustment_fee +
    invoice.tax_credit_additional +
    invoice.faithful_report_fee

  const businessTypeLabel =
    invoice.business_type === 'corporate' ? '법인·의료사업자' : '개인사업자'

  const lineItems = [
    { label: '결산보수', note: '자동산출', amount: invoice.settlement_fee },
    { label: '조정료', note: '자동산출', amount: invoice.adjustment_fee },
    ...(invoice.tax_credit_additional > 0
      ? [{ label: '세액공제 추가', note: '가산', amount: invoice.tax_credit_additional }]
      : []),
    ...(invoice.faithful_report_fee > 0
      ? [{ label: '성실신고 확인료', note: '가산', amount: invoice.faithful_report_fee }]
      : []),
  ]

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
            INVOICE
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            조정료 청구서
          </h1>
          <div style={{ fontSize: '13px', color: '#6b7280' }}>No. {invoiceNo}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px', letterSpacing: '0.05em' }}>
            {OFFICE.address}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', letterSpacing: '0.2em' }}>
            {OFFICE.name.split('').join(' ')}
          </div>
          <div style={{ fontSize: '13px', color: '#4b5563', marginTop: '4px' }}>
            <span style={{ color: '#9ca3af', marginRight: '6px' }}>{OFFICE.representativeTitle}</span>
            <span style={{ fontWeight: 'bold', letterSpacing: '0.3em' }}>{OFFICE.representative.split('').join(' ')}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>T. {OFFICE.phone}</div>
        </div>
      </div>

      {/* FROM / TO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '8px' }}>FROM · 발행자</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a', marginBottom: '4px' }}>{OFFICE.name}</div>
          <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.8' }}>
            {OFFICE.representativeTitle} {OFFICE.representative}<br />
            {OFFICE.address}<br />
            전화: {OFFICE.phone}
          </div>
        </div>
        <div style={{ border: '2px solid #0f172a', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '8px' }}>TO · 수신자</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a', marginBottom: '4px' }}>
            {invoice.client_name}
            <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280', marginLeft: '8px' }}>({businessTypeLabel})</span>
          </div>
          {invoice.business_number && (
            <div style={{ fontSize: '12px', color: '#4b5563' }}>
              사업자등록번호: {formatBusinessNumber(invoice.business_number)}
            </div>
          )}
          {invoice.year && (
            <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>사업연도: {invoice.year}년</div>
          )}
        </div>
      </div>

      {/* 수입금액 별도 박스 */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '4px' }}>REVENUE · 산정 기준 매출액</div>
          <div style={{ fontSize: '13px', color: '#4b5563' }}>수입금액 (정부지원금 포함)</div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
          ₩ {formatCurrency(invoice.revenue)}
        </div>
      </div>

      {/* 명세 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: 'white' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '500' }}>항목</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', fontWeight: '500', width: '120px' }}>구분</th>
            <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', fontWeight: '500', width: '160px' }}>금액 (원)</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a' }}>{item.label}</td>
              <td style={{ padding: '12px 16px', fontSize: '11px', color: '#6b7280' }}>{item.note}</td>
              <td style={{ padding: '12px 16px', fontSize: '13px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid #0f172a' }}>
            <td colSpan={2} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '500', color: '#374151' }}>소 계</td>
            <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: '500' }}>
              {formatCurrency(subtotal)}
            </td>
          </tr>
          {invoice.discount > 0 && (
            <tr>
              <td colSpan={2} style={{ padding: '8px 16px', textAlign: 'right', fontSize: '13px', color: '#dc2626' }}>할 인</td>
              <td style={{ padding: '8px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#dc2626' }}>
                - {formatCurrency(invoice.discount)}
              </td>
            </tr>
          )}
        </tfoot>
      </table>

      {/* 최종 청구액 */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #334155)',
        borderRadius: '12px',
        padding: '24px',
        margin: '0 0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      } as React.CSSProperties}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#94a3b8', marginBottom: '4px' }}>TOTAL DUE</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>최종 청구액</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
            ₩ {formatCurrency(invoice.final_fee)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>(부가세 별도)</div>
        </div>
      </div>

      {/* 결제 정보 */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', marginBottom: '32px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#9ca3af', marginBottom: '12px' }}>PAYMENT · 입금 안내</div>
        <div style={{
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          borderRadius: '6px',
          padding: '10px 16px',
          marginBottom: '16px',
          textAlign: 'center',
          color: 'white',
          fontSize: '13px',
          fontWeight: '500',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        } as React.CSSProperties}>
          자동이체 또는 직접입금 모두 가능합니다
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>은행</div>
            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{OFFICE.bank}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>계좌번호</div>
            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '17px', letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
              {OFFICE.account}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>예금주</div>
            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{OFFICE.accountHolder}</div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.8' }}>
          본 청구서는 {OFFICE.name}이(가) 발행하였습니다.<br />
          청구 내역 관련 문의: {OFFICE.phone}
        </div>
        <div style={{ textAlign: 'right', position: 'relative' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{OFFICE.name}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', marginBottom: '12px' }}>
            {OFFICE.representativeTitle} {OFFICE.representative}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={OFFICE.stampImage}
            alt="직인"
            style={{
              width: '80px',
              height: '80px',
              position: 'absolute',
              right: '-8px',
              top: '-8px',
              opacity: 0.9,
              mixBlendMode: 'multiply',
            }}
          />
        </div>
      </div>
    </A4Page>
  )
}
