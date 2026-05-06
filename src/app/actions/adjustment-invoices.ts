'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type UpsertPayload = {
  id: string | null
  client_id: string | null
  business_type: 'corporate' | 'individual'
  client_name: string
  business_number: string | null
  revenue: number
  settlement_fee: number
  adjustment_fee: number
  tax_credit_additional: number
  faithful_report_fee: number
  discount: number
  supply_amount: number
  vat_amount: number
  total_amount: number
  final_fee: number
  year: number
  payment_method: string
  is_paid: boolean
}

export async function saveInvoiceBatch(input: {
  year: number
  businessType: 'corporate' | 'individual'
  upserts: UpsertPayload[]
  deleteIds: string[]
}): Promise<void> {
  const supabase = await createClient()

  const inserts = input.upserts
    .filter((p) => !p.id)
    .map(({ id: _id, ...rest }) => rest)

  const updates = input.upserts.filter((p) => !!p.id)

  if (inserts.length > 0) {
    const { error } = await supabase.from('adjustment_invoices').insert(inserts)
    if (error) throw new Error(`INSERT 실패: ${error.message}`)
  }

  for (const u of updates) {
    const { id, ...rest } = u
    const { error } = await supabase
      .from('adjustment_invoices')
      .update(rest)
      .eq('id', id!)
    if (error) throw new Error(`UPDATE 실패 (id=${id}): ${error.message}`)
  }

  if (input.deleteIds.length > 0) {
    const { error } = await supabase
      .from('adjustment_invoices')
      .delete()
      .in('id', input.deleteIds)
    if (error) throw new Error(`DELETE 실패: ${error.message}`)
  }

  revalidatePath('/invoices/adjustment')
}
