'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getChecklistData } from '@/lib/db/checklist'
import type { ChecklistRowData } from '@/app/(dashboard)/traders/checklist/types'
import type { TraderProgressStatus } from '@/types/database'

/** Client Component에서 호출하는 refetch 래퍼 */
export async function fetchChecklist(): Promise<ChecklistRowData[]> {
  return getChecklistData()
}

export interface UpdateProgressResult {
  success: boolean
  error?: string
}

/** 진행단계만 변경 (낙관적 업데이트 → 서버에서 확정) */
export async function updateProgressStatus(
  propertyId: string,
  newStatus: TraderProgressStatus,
): Promise<UpdateProgressResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('trader_properties')
      .update({ progress_status: newStatus })
      .eq('id', propertyId)
      .select('client_id')
      .single()

    if (error) return { success: false, error: error.message }

    if (data?.client_id) {
      revalidatePath(`/traders/${data.client_id}`)
    }
    revalidatePath('/traders/checklist')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}
