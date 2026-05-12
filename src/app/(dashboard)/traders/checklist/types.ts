import type { TraderProgressStatus, TraderProperty } from '@/types/database'

export type ChecklistClient = {
  id: string
  company_name: string
  manager: string | null
  business_number: string | null
  trader_drive_folder_url: string | null
}

export type ChecklistRowData = {
  property: TraderProperty
  client: ChecklistClient
}

export type ChecklistFilterState = {
  manager: string // '전체' 또는 담당자명
  yearMonth: string // 'YYYY-MM'
}

export type ChecklistFilterOptions = {
  managers: string[]
  yearMonths: string[]
}

export type { TraderProgressStatus }
