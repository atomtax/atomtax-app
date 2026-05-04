'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ClientInsert, ClientUpdate } from '@/types/database'

export async function createClientAction(data: ClientInsert) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').insert(data)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
}

export async function updateClientAction(id: string, data: ClientUpdate) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
}

export async function terminateClientAction(id: string, terminationDate: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({
      is_terminated: true,
      termination_date: terminationDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  revalidatePath('/clients/terminated')
}

export async function restoreClientAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .update({
      is_terminated: false,
      termination_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clients')
  revalidatePath('/clients/terminated')
}
