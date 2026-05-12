import type { ChecklistRowData } from '@/app/(dashboard)/traders/checklist/types'

/** filing_deadline의 'YYYY-MM' 추출 */
export function extractYearMonth(dateStr: string | null): string | null {
  if (!dateStr) return null
  const match = /^(\d{4})-(\d{2})/.exec(dateStr)
  return match ? `${match[1]}-${match[2]}` : null
}

export function filterByMonth(
  rows: ChecklistRowData[],
  yearMonth: string,
): ChecklistRowData[] {
  return rows.filter(
    (r) => extractYearMonth(r.property.filing_deadline) === yearMonth,
  )
}

export function filterByManager(
  rows: ChecklistRowData[],
  manager: string,
): ChecklistRowData[] {
  if (manager === '전체') return rows
  return rows.filter((r) => (r.client.manager ?? '').trim() === manager)
}

/** 담당자별 그룹화 (담당자 미지정은 '담당자 미지정') */
export function groupByManager(
  rows: ChecklistRowData[],
): { manager: string; rows: ChecklistRowData[] }[] {
  const map = new Map<string, ChecklistRowData[]>()
  for (const row of rows) {
    const key = row.client.manager?.trim() || '담당자 미지정'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(row)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'ko'))
    .map(([manager, list]) => ({ manager, rows: list }))
}

/** 'YYYY-MM' → 한국어 표시 ('2026년 5월') */
export function formatYearMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-')
  return `${y}년 ${Number(m)}월`
}

/** 'YYYY-MM' 한 달 이동 */
export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, (m - 1) + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 오늘의 'YYYY-MM' */
export function getCurrentYearMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
