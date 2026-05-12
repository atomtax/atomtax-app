'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { fetchChecklist } from '@/app/actions/checklist'
import {
  filterByManager,
  filterByMonth,
  getCurrentYearMonth,
} from '@/lib/utils/checklist-filter'
import type {
  ChecklistFilterOptions,
  ChecklistRowData,
} from './types'
import type { TraderProgressStatus } from '@/types/database'
import { ChecklistHeader } from './components/ChecklistHeader'
import { InProgressSection } from './components/InProgressSection'
import { CompletedSection } from './components/CompletedSection'
import { ManagerGroupSection } from './components/ManagerGroupSection'

interface Props {
  initialRows: ChecklistRowData[]
  options: ChecklistFilterOptions
}

export function ChecklistClient({ initialRows, options }: Props) {
  const [rows, setRows] = useState<ChecklistRowData[]>(initialRows)
  const [manager, setManager] = useState<string>('전체')
  const [yearMonth, setYearMonth] = useState<string>(getCurrentYearMonth())
  const [isRefetching, startRefetch] = useTransition()

  // 선택 년월의 진행중/신고완료 분류 (담당자 드롭다운 반영)
  const monthFiltered = useMemo(
    () => filterByMonth(rows, yearMonth),
    [rows, yearMonth],
  )
  const monthManagerFiltered = useMemo(
    () => filterByManager(monthFiltered, manager),
    [monthFiltered, manager],
  )
  const inProgress = useMemo(
    () =>
      monthManagerFiltered.filter(
        (r) => r.property.progress_status !== '신고완료',
      ),
    [monthManagerFiltered],
  )
  const completed = useMemo(
    () =>
      monthManagerFiltered.filter(
        (r) => r.property.progress_status === '신고완료',
      ),
    [monthManagerFiltered],
  )

  const refetch = useCallback(() => {
    startRefetch(async () => {
      try {
        const fresh = await fetchChecklist()
        setRows(fresh)
      } catch (e) {
        console.error('체크리스트 갱신 실패', e)
      }
    })
  }, [])

  // 낙관적 업데이트: 단일 row의 progress_status를 즉시 반영
  const applyOptimisticStatus = useCallback(
    (propertyId: string, status: TraderProgressStatus) => {
      setRows((prev) =>
        prev.map((r) =>
          r.property.id === propertyId
            ? { ...r, property: { ...r.property, progress_status: status } }
            : r,
        ),
      )
    },
    [],
  )

  return (
    <div className="space-y-6">
      <ChecklistHeader
        manager={manager}
        yearMonth={yearMonth}
        options={options}
        onManagerChange={setManager}
        onYearMonthChange={setYearMonth}
        onRefresh={refetch}
        isRefreshing={isRefetching}
      />

      <InProgressSection
        rows={inProgress}
        onStatusChange={applyOptimisticStatus}
      />

      <CompletedSection
        rows={completed}
        onStatusChange={applyOptimisticStatus}
      />

      <ManagerGroupSection
        allRows={rows}
        yearMonth={yearMonth}
        onYearMonthChange={setYearMonth}
      />
    </div>
  )
}
