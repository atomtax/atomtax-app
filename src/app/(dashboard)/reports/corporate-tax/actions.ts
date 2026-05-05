'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CorporateTaxReportInsert } from '@/types/database'

export async function upsertCorporateTaxReportAction(data: CorporateTaxReportInsert) {
  const supabase = await createClient()
  const { data: saved, error } = await supabase
    .from('corporate_tax_reports')
    .upsert(data, { onConflict: 'client_id,year' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/reports/corporate-tax')
  revalidatePath(`/clients/${data.client_id}`)
  return saved
}

export async function deleteCorporateTaxReportAction(id: string, clientId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('corporate_tax_reports').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/reports/corporate-tax')
  revalidatePath(`/clients/${clientId}`)
}
