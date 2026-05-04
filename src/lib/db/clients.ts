'use server'

import { createClient } from '@/lib/supabase/server'
import type { Client, ClientInsert, ClientUpdate } from '@/types/database'

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_terminated', false)
    .order('number', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getTerminatedClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_terminated', true)
    .order('termination_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createClient_(client: ClientInsert): Promise<Client> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateClient(id: string, client: ClientUpdate): Promise<Client> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .update({ ...client, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function terminateClient(id: string, terminationDate: string): Promise<Client> {
  return updateClient(id, {
    is_terminated: true,
    termination_date: terminationDate,
  })
}
