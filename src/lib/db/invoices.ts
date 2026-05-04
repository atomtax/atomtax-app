'use server'

import { createClient } from '@/lib/supabase/server'
import type { AdjustmentInvoice, AdjustmentInvoiceInsert, AdjustmentInvoiceUpdate } from '@/types/database'

export async function getAdjustmentInvoices(): Promise<AdjustmentInvoice[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('adjustment_invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getAdjustmentInvoiceById(id: string): Promise<AdjustmentInvoice | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('adjustment_invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createAdjustmentInvoice(invoice: AdjustmentInvoiceInsert): Promise<AdjustmentInvoice> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('adjustment_invoices')
    .insert(invoice)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateAdjustmentInvoice(id: string, invoice: AdjustmentInvoiceUpdate): Promise<AdjustmentInvoice> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('adjustment_invoices')
    .update({ ...invoice, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteAdjustmentInvoice(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('adjustment_invoices').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
