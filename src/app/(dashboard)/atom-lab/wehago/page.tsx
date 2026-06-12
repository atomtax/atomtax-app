import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import {
  fetchWehagoCompanies,
  fetchSnapshotMeta,
  fetchSnapshotsForCompany,
  type WehagoCompanyWithClient,
  type SnapshotMeta,
} from '@/lib/db/wehago'
import { WEHAGO_SCREEN } from '@/lib/wehago/types'
import WehagoCollectForm from './WehagoCollectForm'
import WehagoReviewPanel from './WehagoReviewPanel'

export const metadata: Metadata = {
  title: '아톰랩 · 위하고 수집',
}

const SCREEN_COLUMNS: { code: string; label: string }[] = [
  { code: WEHAGO_SCREEN.INCOME_STATEMENT, label: '손익' },
  { code: WEHAGO_SCREEN.PAYROLL, label: '급여' },
  { code: WEHAGO_SCREEN.FIXED_ASSET, label: '고정자산' },
  { code: WEHAGO_SCREEN.BUSINESS_INCOME, label: '사업소득' },
]

function formatBizNumber(value: string | null): string {
  if (!value) return '—'
  const d = value.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
  return value
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
}

/** ccode별 화면코드 → 최신 collected_at 맵 (meta는 collected_at desc 정렬) */
function buildLatestMap(
  meta: SnapshotMeta[],
): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {}
  for (const m of meta) {
    const byScreen = (map[m.ccode] ??= {})
    if (!byScreen[m.screen_code]) byScreen[m.screen_code] = m.collected_at
  }
  return map
}

export default async function WehagoPage({
  searchParams,
}: {
  searchParams: Promise<{ ccode?: string }>
}) {
  const { ccode } = await searchParams
  const [companies, meta] = await Promise.all([
    fetchWehagoCompanies(),
    fetchSnapshotMeta(),
  ])
  const latestMap = buildLatestMap(meta)

  const selected: WehagoCompanyWithClient | undefined = ccode
    ? companies.find((c) => c.ccode === ccode)
    : undefined
  const selectedSnapshots = selected
    ? await fetchSnapshotsForCompany(selected.ccode)
    : []

  return (
    <div>
      <Header
        title="위하고 데이터 수집"
        subtitle="더존 위하고T 화면 데이터를 붙여넣어 검산 (Phase 7 · 실험)"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 왼쪽: 수집 폼 + 회사 목록 */}
        <div className="space-y-6">
          <WehagoCollectForm />

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">수집 회사</h2>
            {companies.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                아직 수집된 회사가 없습니다. 수임처 기본정보(sabc0102)를 먼저 등록하세요.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-200">
                      <th className="text-left font-semibold py-2">상호</th>
                      <th className="text-left font-semibold py-2">사업자번호</th>
                      <th className="text-center font-semibold py-2">기수</th>
                      <th className="text-left font-semibold py-2">거래처</th>
                      {SCREEN_COLUMNS.map((s) => (
                        <th key={s.code} className="text-center font-semibold py-2">
                          {s.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => {
                      const byScreen = latestMap[c.ccode] ?? {}
                      const isSelected = c.ccode === ccode
                      return (
                        <tr
                          key={c.id}
                          className={`border-b border-gray-50 hover:bg-brand/5 ${
                            isSelected ? 'bg-brand/5' : ''
                          }`}
                        >
                          <td className="py-2">
                            <Link
                              href={`/atom-lab/wehago?ccode=${encodeURIComponent(c.ccode)}`}
                              className="font-semibold text-brand hover:underline"
                            >
                              {c.company_name ?? c.ccode}
                            </Link>
                          </td>
                          <td className="py-2 text-gray-600 tabular-nums">
                            {formatBizNumber(c.business_number)}
                          </td>
                          <td className="py-2 text-center text-gray-600">
                            {c.gisu ?? '—'}
                          </td>
                          <td className="py-2">
                            {c.matched_client_name ? (
                              <span className="text-gray-700">{c.matched_client_name}</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 text-[11px]">
                                미매칭
                              </span>
                            )}
                          </td>
                          {SCREEN_COLUMNS.map((s) => (
                            <td
                              key={s.code}
                              className="py-2 text-center text-[11px] text-gray-500 tabular-nums"
                            >
                              {byScreen[s.code] ? formatShort(byScreen[s.code]) : '—'}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 검토 패널 */}
        <div>
          {selected ? (
            <WehagoReviewPanel company={selected} snapshots={selectedSnapshots} />
          ) : (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm">왼쪽 목록에서 회사를 선택하면 검토 결과가 표시됩니다</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
