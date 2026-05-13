'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface TraderReviewNoteInput {
  client_id: string
  memo: string
  is_confirmed: boolean
}

export interface SaveTraderReviewNotesInput {
  year: number
  notes: TraderReviewNoteInput[]
}

export async function saveTraderReviewNotes(
  input: SaveTraderReviewNotesInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.notes.length === 0) return { ok: true }

  const supabase = await createClient()
  const rows = input.notes.map((n) => ({
    client_id: n.client_id,
    report_year: input.year,
    memo: n.memo,
    is_confirmed: n.is_confirmed,
  }))

  const { error } = await supabase
    .from('trader_review_notes')
    .upsert(rows, { onConflict: 'client_id,report_year' })

  if (error) {
    console.error('[saveTraderReviewNotes]', error)
    return { ok: false, error: error.message }
  }

  revalidatePath('/reports-review/income-tax/trader')
  return { ok: true }
}
