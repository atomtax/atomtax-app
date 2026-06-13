import type { WehagoSnapshot } from '@/types/database'
import type { Json } from '@/lib/wehago/types'
import { WEHAGO_SCREEN, SCREEN_LABEL } from '@/lib/wehago/types'
import { formatIncomeAmount } from '@/lib/utils/income-statement-labels'
import {
  extractIncomeStatementRows,
  extractPayrollRows,
  extractFixedAssetRows,
  extractBusinessIncomeRows,
  payrollTotal,
  incomeLaborTotal,
  fixedAssetDepreciation,
  incomeDepreciation,
  businessIncomeTotal,
  computeLaborRule,
  computeDepreciationRule,
} from '@/lib/wehago/rules'
import type { WehagoCompanyWithClient } from '@/lib/db/wehago'

const STALE_DAYS = 7

function isStale(collectedAt: string): boolean {
  const ageMs = Date.now() - new Date(collectedAt).getTime()
  return ageMs > STALE_DAYS * 24 * 60 * 60 * 1000
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPeriod(period: string | null): string {
  if (!period || period.length < 6) return '—'
  return `${period.slice(0, 4)}.${period.slice(4, 6)}`
}

function won(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

/** 화면코드별 최신 스냅샷 1건씩 추출 (snapshots는 collected_at desc 정렬) */
function latestByScreen(
  snapshots: WehagoSnapshot[],
): Record<string, WehagoSnapshot> {
  const map: Record<string, WehagoSnapshot> = {}
  for (const s of snapshots) {
    if (!map[s.screen_code]) map[s.screen_code] = s
  }
  return map
}

export default function WehagoReviewPanel({
  company,
  snapshots,
}: {
  company: WehagoCompanyWithClient
  snapshots: WehagoSnapshot[]
}) {
  const latest = latestByScreen(snapshots)
  const incomeSnap = latest[WEHAGO_SCREEN.INCOME_STATEMENT]
  const payrollSnap = latest[WEHAGO_SCREEN.PAYROLL]
  const fixedSnap = latest[WEHAGO_SCREEN.FIXED_ASSET]
  const buSnap = latest[WEHAGO_SCREEN.BUSINESS_INCOME]

  const incomeRows = incomeSnap
    ? extractIncomeStatementRows(incomeSnap.payload as Json)
    : []
  const payrollRows = payrollSnap
    ? extractPayrollRows(payrollSnap.payload as Json)
    : []
  const fixedRows = fixedSnap
    ? extractFixedAssetRows(fixedSnap.payload as Json)
    : []
  const buRows = buSnap ? extractBusinessIncomeRows(buSnap.payload as Json) : []

  const laborRule = computeLaborRule({
    hasPayroll: !!payrollSnap,
    payrollTotal: payrollTotal(payrollRows),
    incomeLaborTotal: incomeLaborTotal(incomeRows),
    payrollPeriodTo: payrollSnap?.period_to ?? null,
    incomePeriodTo: incomeSnap?.period_to ?? null,
  })
  const depRule = computeDepreciationRule({
    hasFixedAsset: !!fixedSnap,
    fixedAssetDep: fixedAssetDepreciation(fixedRows),
    incomeDep: incomeDepreciation(incomeRows),
  })
  const buTotal = businessIncomeTotal(buRows)

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-extrabold text-gray-900">
            {company.company_name ?? company.ccode}
          </h2>
          {company.matched_client_name ? (
            <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
              {company.matched_client_name}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
              미매칭
            </span>
          )}
          {company.gisu != null && (
            <span className="text-xs text-gray-500">{company.gisu}기</span>
          )}
        </div>
        {/* 수집 신선도 */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[incomeSnap, payrollSnap, fixedSnap, buSnap]
            .filter((s): s is WehagoSnapshot => !!s)
            .map((s) => {
              const stale = isStale(s.collected_at)
              return (
                <span
                  key={s.screen_code}
                  className={`px-2 py-1 rounded text-[11px] font-medium border ${
                    stale
                      ? 'bg-gray-100 border-gray-300 text-gray-500'
                      : 'bg-green-50 border-green-200 text-green-700'
                  }`}
                  title={formatDateTime(s.collected_at)}
                >
                  {SCREEN_LABEL[s.screen_code] ?? s.screen_code} ·{' '}
                  {formatDateTime(s.collected_at)}
                  {stale && ' ⚠️'}
                </span>
              )
            })}
        </div>
      </div>

      {/* (a) 손익계산서 */}
      {incomeSnap ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">손익계산서</h3>
            <span className="text-xs text-gray-500">
              {incomeSnap.gisu ?? company.gisu}기 · {formatPeriod(incomeSnap.period_to)}까지 누계 ·
              수집 {formatDateTime(incomeSnap.collected_at)}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200">
                <th className="text-left font-semibold py-2">계정</th>
                <th className="text-right font-semibold py-2">당기</th>
                <th className="text-right font-semibold py-2">전기</th>
                <th className="text-right font-semibold py-2">증감</th>
              </tr>
            </thead>
            <tbody>
              {incomeRows.map((row, i) => {
                const isSection = row.cd_acctit === '0'
                const cur = isSection ? row.mn_total2 : row.mn_total1
                const prev = isSection ? row.mn_btotal2 : row.mn_btotal1
                return (
                  <tr
                    key={i}
                    className={`border-b border-gray-50 ${
                      isSection ? 'font-bold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <td className={`py-1.5 ${isSection ? '' : 'pl-4'}`}>
                      {row.nm_acctit_cd ?? row.nm_acctit ?? ''}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      <AmountCell value={cur} />
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-gray-500">
                      <AmountCell value={prev} />
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-gray-500">
                      <AmountCell value={row.mn_variation_amount} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <MissingCard label="손익계산서(sacl0106) 미수집" />
      )}

      {/* (b) 인건비 대조 */}
      <LaborCard
        rule={laborRule}
        hasIncome={!!incomeSnap}
        buCollected={!!buSnap}
        buTotal={buTotal}
      />

      {/* (c) 감가상각 대조 */}
      <DepreciationCard rule={depRule} hasIncome={!!incomeSnap} />
    </div>
  )
}

function AmountCell({ value }: { value: number | undefined }) {
  if (value == null) return <span>—</span>
  const neg = value < 0
  return (
    <span className={neg ? 'text-red-600' : ''}>{formatIncomeAmount(value)}</span>
  )
}

function MissingCard({ label }: { label: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-400">
      ⬜ {label}
    </div>
  )
}

function LaborCard({
  rule,
  hasIncome,
  buCollected,
  buTotal,
}: {
  rule: ReturnType<typeof computeLaborRule>
  hasIncome: boolean
  buCollected: boolean
  buTotal: number
}) {
  if (rule.status === 'missing') {
    return <MissingCard label="급여대장(swsa0105) 미수집 — 인건비 대조 불가" />
  }
  const ok = rule.status === 'ok'
  return (
    <div
      className={`rounded-xl p-5 border ${
        ok ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'
      }`}
    >
      <div className="font-bold mb-2">
        {ok ? '✅ 급여대장과 손익 인건비 일치' : '⚠️ 인건비 불일치'}
        {ok && <span className="ml-1">({won(rule.payrollTotal)})</span>}
      </div>
      {!ok && (
        <div className="text-sm text-amber-900 space-y-0.5">
          <div>차이: {won(rule.diff)}</div>
          <div className="text-xs text-amber-700">
            급여대장 합계 {won(rule.payrollTotal)} · 손익 인건비(802/803/805){' '}
            {won(rule.incomeLaborTotal)}
            {!hasIncome && ' · 손익 미수집'}
          </div>
        </div>
      )}
      {rule.periodMismatch && (
        <div className="text-xs text-amber-700 mt-1">
          ⚠️ 조회 기간 다름 — 기간이 다르면 불일치가 정상일 수 있습니다
        </div>
      )}
      {buCollected && (
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-black/5">
          사업소득 지급(3.3%): {won(buTotal)} — 지급수수료/외주용역비와 별도 대조 필요
        </div>
      )}
    </div>
  )
}

function DepreciationCard({
  rule,
  hasIncome,
}: {
  rule: ReturnType<typeof computeDepreciationRule>
  hasIncome: boolean
}) {
  if (rule.status === 'missing') {
    return <MissingCard label="고정자산(saas0106) 미수집 — 감가상각 대조 불가" />
  }
  if (rule.status === 'ok') {
    return (
      <div className="rounded-xl p-5 border bg-green-50 border-green-300">
        <div className="font-bold">
          ✅ 고정자산 상각비와 손익 일치 ({won(rule.fixedAssetDep)})
        </div>
      </div>
    )
  }
  if (rule.status === 'critical') {
    return (
      <div className="rounded-xl p-5 border bg-red-50 border-red-300">
        <div className="font-bold text-red-700">
          🔴 고정자산 상각비가 손익에 미계상
        </div>
        <div className="text-sm text-red-900 mt-1">
          고정자산 당기상각비 {won(rule.fixedAssetDep)} · 손익 [818] 0원
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-xl p-5 border bg-amber-50 border-amber-300">
      <div className="font-bold text-amber-800">⚠️ 감가상각 불일치</div>
      <div className="text-sm text-amber-900 mt-1">차이: {won(rule.diff)}</div>
      <div className="text-xs text-amber-700">
        고정자산 {won(rule.fixedAssetDep)} · 손익 [818] {won(rule.incomeDep)}
        {!hasIncome && ' · 손익 미수집'}
      </div>
    </div>
  )
}
