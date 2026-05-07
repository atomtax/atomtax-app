'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TraderInventoryWithClient, TraderInventoryInput, ProgressStatus } from '@/types/database'
import { TRADER_BUSINESS_CODES } from '@/types/database'

export interface InventoryRowSave {
  id?: string
  client_id: string | null
  property_address: string | null
  property_type: string | null
  acquisition_date: string | null
  acquisition_price: number | null
  transfer_date: string | null
  transfer_price: number | null
  filing_deadline: string | null
  progress_status: ProgressStatus
  is_taxable: boolean
  output_vat: number | null
  notes: string | null
}

export interface SaveInventoryBatchResult {
  refreshedData: TraderInventoryWithClient[]
}

export async function saveInventoryBatchAction(
  toSave: InventoryRowSave[],
  toDeleteIds: string[]
): Promise<SaveInventoryBatchResult> {
  const supabase = await createClient()

  // Deletes
  if (toDeleteIds.length > 0) {
    const { error } = await supabase.from('trader_inventory').delete().in('id', toDeleteIds)
    if (error) throw new Error(error.message)
  }

  // Upserts
  for (const row of toSave) {
    const payload: TraderInventoryInput = {
      client_id: row.client_id,
      property_address: row.property_address,
      property_type: row.property_type,
      acquisition_date: row.acquisition_date,
      acquisition_price: row.acquisition_price,
      transfer_date: row.transfer_date,
      transfer_price: row.transfer_price,
      filing_deadline: row.filing_deadline,
      progress_status: row.progress_status,
      is_taxable: row.is_taxable,
      output_vat: row.output_vat,
      notes: row.notes,
    }

    if (row.id) {
      const { error } = await supabase
        .from('trader_inventory')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', row.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('trader_inventory').insert(payload)
      if (error) throw new Error(error.message)
    }
  }

  revalidatePath('/traders')

  // Re-fetch fresh data
  const { data, error: fetchError } = await supabase
    .from('trader_inventory')
    .select(`
      *,
      client:clients!inner(id, company_name, representative, business_number, business_category_code)
    `)
    .in('client.business_category_code', [...TRADER_BUSINESS_CODES])
    .order('filing_deadline', { ascending: true, nullsFirst: false })

  if (fetchError) throw new Error(fetchError.message)
  return { refreshedData: (data ?? []) as TraderInventoryWithClient[] }
}
