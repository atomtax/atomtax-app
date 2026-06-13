import type { ClosingChange, TpSalesSnapshot, WehagoSnapshot } from '@/types/database'
import type { WehagoCompanyWithClient } from '@/lib/db/wehago'
import WehagoReviewPanel from '../wehago/WehagoReviewPanel'

function won(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

export default function ClosingDetailPanel({
  change,
  tp,
  wehago,
}: {
  change: ClosingChange
  tp: TpSalesSnapshot | null
  wehago: { company: WehagoCompanyWithClient; snapshots: WehagoSnapshot[] } | null
}) {
  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-extrabold text-gray-900">
          {change.company_name ?? change.business_number}
        </h2>
        <div className="text-xs text-gray-500 mt-1">
          {change.change_type === 'new_closed' ? '🆕 신규마감' : '🔄 재마감'}
          {change.period ? ` · ${change.period}` : ''}
        </div>
      </div>

      {/* TP 매출 대조 카드 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-base font-bold text-gray-900 mb-3">TP 매출 (홈택스)</h3>
        {tp ? (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm text-gray-600">
                신고매출 ({tp.period_from ?? '?'}~{tp.period_to ?? '?'})
              </span>
              <span className="text-xl font-extrabold text-brand tabular-nums">
                {won(tp.sales_total)}
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {(
                  [
                    ['세금계산서', tp.sales_tax_invoice],
                    ['계산서', tp.sales_invoice],
                    ['현금영수증', tp.sales_cash_receipt],
                    ['신용카드', tp.sales_card],
                    ['수출실적', tp.sales_export],
                    ['제로페이', tp.sales_zeropay],
                  ] as Array<[string, number]>
                )
                  .filter(([, v]) => v !== 0)
                  .map(([label, v]) => (
                    <tr key={label} className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-600">{label}</td>
                      <td className="py-1.5 text-right tabular-nums">{won(v)}</td>
                    </tr>
                  ))}
                <tr>
                  <td className="py-1.5 text-gray-400 text-xs">(참고) 매입 세금계산서</td>
                  <td className="py-1.5 text-right tabular-nums text-gray-400 text-xs">
                    {won(tp.purchase_tax_invoice)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-3">
              위하고 부가세 신고서 과세표준과의 자동 대조는 다음 단계에서 연동됩니다.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            이 거래처의 TP 매출 업로드가 없습니다. 왼쪽에서 합계표를 업로드하세요.
          </p>
        )}
      </div>

      {/* 1단계 위하고 스냅샷이 있으면 손익·인건비·감가상각 룰 재사용 */}
      {wehago && wehago.snapshots.length > 0 && (
        <WehagoReviewPanel company={wehago.company} snapshots={wehago.snapshots} />
      )}
    </div>
  )
}
