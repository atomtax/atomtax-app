'use server'

import { createClient } from '@/lib/supabase/server'
import type { TraderInventory, TraderInventoryInsert, TraderInventoryUpdate, Expense, ExpenseInsert } from '@/types/database'

export async function getTraderInventories(): Promise<TraderInventory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .select('*')
    .order('report_deadline', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getTraderInventoriesByClient(clientId: string): Promise<TraderInventory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .select('*')
    .eq('client_id', clientId)
    .order('acquisition_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getTraderInventoryById(id: string): Promise<TraderInventory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createTraderInventory(inventory: TraderInventoryInsert): Promise<TraderInventory> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trader_inventory')
    .insert(inventory)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
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
  return data
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
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createExpense(expense: ExpenseInsert): Promise<Expense> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
