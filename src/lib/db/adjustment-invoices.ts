'use server'

import { createClient } from '@/lib/supabase/server'
import type { AdjustmentInvoice } from '@/types/database'

export async function listAdjustmentInvoices(filter: {
  year: number
  businessType: 'corporate' | 'individual'
}): Promise<AdjustmentInvoice[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('adjustment_invoices')
    .select('*')
    .eq('year', filter.year)
    .eq('business_type', filter.businessType)
    .order('client_name')
  if (error) throw new Error(error.message)
  return (data ?? []) as AdjustmentInvoice[]
}

export async function getAdjustmentInvoiceById(id: string): Promise<AdjustmentInvoice | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('adjustment_invoices')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as AdjustmentInvoice
}
