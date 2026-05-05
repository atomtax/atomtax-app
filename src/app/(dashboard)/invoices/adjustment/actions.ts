'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AdjustmentInvoiceInsert, AdjustmentInvoiceUpdate } from '@/types/database'

export async function createAdjustmentInvoiceAction(data: AdjustmentInvoiceInsert) {
  const supabase = await createClient()
  const { data: created, error } = await supabase
    .from('adjustment_invoices')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/invoices/adjustment')
  return created
}

export async function updateAdjustmentInvoiceAction(id: string, data: AdjustmentInvoiceUpdate) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('adjustment_invoices')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/invoices/adjustment')
}

export async function deleteAdjustmentInvoiceAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('adjustment_invoices').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/invoices/adjustment')
}
