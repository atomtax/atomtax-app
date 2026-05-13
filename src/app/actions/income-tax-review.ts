'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ReviewNoteInput {
  client_id: string
  memo: string
  is_confirmed: boolean
}

export interface SaveReviewNotesInput {
  year: number
  notes: ReviewNoteInput[]
}

export async function saveReviewNotes(
  input: SaveReviewNotesInput,
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
    .from('income_tax_review_notes')
    .upsert(rows, { onConflict: 'client_id,report_year' })

  if (error) {
    console.error('[saveReviewNotes]', error)
    return { ok: false, error: error.message }
  }

  revalidatePath('/reports-review/income-tax/personal')
  return { ok: true }
}
