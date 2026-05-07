'use server'

import { createClient } from '@/lib/supabase/server'
import {
  TRADER_BUSINESS_CODES,
  type TraderInventory,
  type TraderInventoryInsert,
  type TraderInventoryUpdate,
  type TraderInventoryWithClient,
  type Expense,
  type ExpenseInsert,
} from '@/types/database'

export interface TraderClient {
  id: string
  company_name: string
  representative: string | null
  business_number: string | null
  business_category_code: string | null
}

export async function listTraderClients(): Promise<TraderClient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, company_name, representative, business_number, business_category_code')
    .eq('is_terminated', false)
    .in('business_category_code', [...TRADER_BUSINESS_CODES])
    .order('company_name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as TraderClient[]
}

export async function listAllTraderInventory(): Promise<TraderInventoryWithClient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .select(`
      *,
      client:clients!inner(id, company_name, representative, business_number, business_category_code)
    `)
    .in('client.business_category_code', [...TRADER_BUSINESS_CODES])
    .order('filing_deadline', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as TraderInventoryWithClient[]
}

export async function listInventoryByClient(clientId: string): Promise<TraderInventory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .select('*')
    .eq('client_id', clientId)
    .order('acquisition_date', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as TraderInventory[]
}

export async function getTraderInventoryById(id: string): Promise<TraderInventory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as TraderInventory
}

export async function createTraderInventory(inventory: TraderInventoryInsert): Promise<TraderInventory> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .insert(inventory)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as TraderInventory
}

export async function updateTraderInventory(id: string, inventory: TraderInventoryUpdate): Promise<TraderInventory> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .update({ ...inventory, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as TraderInventory
}

export async function deleteTraderInventory(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trader_inventory').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getExpensesByInventory(inventoryId: string): Promise<Expense[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('trader_inventory_id', inventoryId)
    .order('expense_date', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Expense[]
}

export async function createExpense(expense: ExpenseInsert): Promise<Expense> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Expense
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
