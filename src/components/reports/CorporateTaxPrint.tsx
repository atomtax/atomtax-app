import A4Page from '@/components/print/A4Page'
import { OFFICE } from '@/lib/constants/office'
import { formatAmount } from '@/lib/utils/format'
import type { CorporateTaxReport, IncomeStatementSummary, TaxCredit, TaxReduction } from '@/types/database'

interface Client {
  company_name: string
  business_number: string | null
  representative: string | null
  manager: string | null
}

interface Props {
  client: Client
  report: CorporateTaxReport
  year: number
}

const IS_ROWS: Array<{ label: string; key: keyof IncomeStatementSummary; bold?: boolean }> = [
  { label: 'Ⅰ. 매출액', key: 'revenue', bold: true },
  { label: 'Ⅱ. 매출원가', key: 'cogs' },
  { label: 'Ⅲ. 매출총이익', key: 'gross_profit', bold: true },
  { label: 'Ⅳ. 판매비와 관리비', key: 'sga' },
  { label: 'Ⅴ. 영업이익', key: 'operating_income', bold: true },
  { label: 'Ⅵ. 영업외수익', key: 'non_operating_revenue' },
  { label: 'Ⅶ. 영업외비용', key: 'non_operating_expense' },
  { label: 'Ⅷ. 법인세차감전이익', key: 'pretax_income' },
  { label: 'Ⅸ. 법인세등', key: 'corporate_tax' },
  { label: 'Ⅹ. 당기순이익', key: 'net_income', bold: true },
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#374151',
        borderBottom: '1.5px solid #6366f1',
        paddingBottom: '4px',
        marginBottom: '8px',
        marginTop: '20px',
      }}
    >
      {children}
    </div>
  )
}

function TableRow({
  label,
  value,
  bold,
  highlight,
  input,
}: {
  label: string
  value?: string
  bold?: boolean
  highlight?: boolean
  input?: React.ReactNode
}) {
  return (
    <tr
      style={{
        backgroundColor: highlight ? '#eef2ff' : bold ? '#f8fafc' : 'transparent',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <td
        style={{
          padding: '5px 10px',
          fontSize: '10px',
          fontWeight: bold ? 600 : 400,
          color: highlight ? '#3730a3' : '#374151',
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '5px 10px',
          textAlign: 'right',
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: bold ? 600 : 400,
          color: highlight ? '#3730a3' : '#374151',
          whiteSpace: 'nowrap',
        }}
      >
        {input ?? value}
      </td>
    </tr>
  )
}

export function CorporateTaxPrint({ client, report, year }: Props) {
  const s = report.income_statement_summary
  const hasCredits = report.tax_credits.length > 0
  const hasReductions = report.tax_reductions.length > 0
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <A4Page>
      {/* 상단 그라디언트 바 */}
      <div
        style={{
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          height: '6px',
          marginLeft: '-15mm',
          marginRight: '-15mm',
          marginTop: '-15mm',
          marginBottom: '24px',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        } as React.CSSProperties}
      />

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.5px' }}>
            법인세 신고 보고서
          </div>
          <div style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600, marginTop: '2px' }}>
            {year}년 사업연도
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: '#6b7280' }}>
          <div style={{ fontWeight: 700, fontSize: '12px', color: '#374151' }}>{OFFICE.name}</div>
          <div>{OFFICE.representativeTitle} {OFFICE.representative}</div>
          <div>{OFFICE.phone}</div>
          <div>{today}</div>
        </div>
      </div>

      {/* 고객 정보 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '4px',
          fontSize: '10px',
        }}
      >
        <div><span style={{ color: '#9ca3af' }}>상호명</span>&nbsp;&nbsp;<strong>{client.company_name}</strong></div>
        <div><span style={{ color: '#9ca3af' }}>사업자번호</span>&nbsp;&nbsp;{client.business_number ?? '—'}</div>
        <div><span style={{ color: '#9ca3af' }}>대표자</span>&nbsp;&nbsp;{client.representative ?? '—'}</div>
        <div><span style={{ color: '#9ca3af' }}>담당자</span>&nbsp;&nbsp;{client.manager ?? '—'}</div>
      </div>

      {/* 손익계산서 요약 */}
      {s && (
        <>
          <SectionTitle>
            손익계산서 요약
            {report.income_statement_period_label && (
              <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '8px' }}>
                ({report.income_statement_period_label})
              </span>
            )}
          </SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <tbody>
              {IS_ROWS.map((row) => (
                <TableRow
                  key={row.key}
                  label={row.label}
                  value={`${formatAmount(s[row.key])}원`}
                  bold={row.bold}
                />
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 세금 계산 */}
      <SectionTitle>세금 계산</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
        <tbody>
          <TableRow label="당기순이익" value={`${formatAmount(report.net_income ?? 0)}원`} />
          <TableRow label="(−) 이월결손금" value={`${formatAmount(report.carryover_loss)}원`} />
          <TableRow
            label="과세표준"
            value={`${formatAmount(Math.max(0, (report.net_income ?? 0) - report.carryover_loss))}원`}
            bold
          />
          <TableRow label="산출세액" value={`${formatAmount(report.calculated_tax)}원`} />
          <TableRow
            label="(−) 세액공제 합계"
            value={`${formatAmount(report.tax_credits.reduce((s, c) => s + c.current_amount + c.carryover_amount, 0))}원`}
          />
          <TableRow
            label="(−) 세액감면 합계"
            value={`${formatAmount(report.tax_reductions.reduce((s, r) => s + r.current_amount, 0))}원`}
          />
          <TableRow label="결정세액" value={`${formatAmount(report.determined_tax)}원`} bold />
          <TableRow label="(+) 지방소득세 (10%)" value={`${formatAmount(report.local_tax)}원`} />
          <TableRow label="(+) 농어촌특별세" value={`${formatAmount(report.rural_special_tax)}원`} />
          <TableRow label="(−) 기납부세액" value={`${formatAmount(report.prepaid_tax)}원`} />
          <TableRow label="최종 납부세액" value={`${formatAmount(report.final_tax)}원`} bold highlight />
        </tbody>
      </table>

      {/* 세액공제 목록 */}
      {hasCredits && (
        <>
          <SectionTitle>세액공제 내역</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>공제 구분</th>
                <th style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>당기 공제액</th>
                <th style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>이월 공제액</th>
              </tr>
            </thead>
            <tbody>
              {report.tax_credits.map((c: TaxCredit, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '5px 10px', color: '#374151' }}>
                    {c.type === '직접 입력' ? (c.custom_name ?? c.type) : c.type}
                  </td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {formatAmount(c.current_amount)}원
                  </td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {formatAmount(c.carryover_amount)}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 세액감면 목록 */}
      {hasReductions && (
        <>
          <SectionTitle>세액감면 내역</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>감면 구분</th>
                <th style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, color: '#374151' }}>감면액</th>
              </tr>
            </thead>
            <tbody>
              {report.tax_reductions.map((r: TaxReduction, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '5px 10px', color: '#374151' }}>
                    {r.type === '직접 입력' ? (r.custom_name ?? r.type) : r.type}
                  </td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {formatAmount(r.current_amount)}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 메모 */}
      {(report.additional_notes || report.conclusion_notes) && (
        <>
          <SectionTitle>메모 / 의견</SectionTitle>
          {report.additional_notes && (
            <div style={{ fontSize: '10px', color: '#374151', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
              <span style={{ color: '#9ca3af', fontWeight: 600 }}>추가 메모&nbsp;</span>
              {report.additional_notes}
            </div>
          )}
          {report.conclusion_notes && (
            <div style={{ fontSize: '10px', color: '#374151', whiteSpace: 'pre-wrap' }}>
              <span style={{ color: '#9ca3af', fontWeight: 600 }}>결론&nbsp;</span>
              {report.conclusion_notes}
            </div>
          )}
        </>
      )}

      {/* 하단 */}
      <div
        style={{
          marginTop: '28px',
          paddingTop: '12px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#9ca3af',
        }}
      >
        <span>{OFFICE.name} · {OFFICE.address}</span>
        <span>{OFFICE.phone}</span>
      </div>
    </A4Page>
  )
}
