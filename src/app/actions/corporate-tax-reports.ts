'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function ensureCorporateTaxReport(
  clientId: string,
  year: number
): Promise<{ id: string }> {
  const supabase = await createClient()

  const { data: existing, error: e1 } = await supabase
    .from('corporate_tax_reports')
    .select('id')
    .eq('client_id', clientId)
    .eq('report_year', year)
    .maybeSingle()

  if (e1) throw new Error(`보고서 조회 실패: ${e1.message}`)
  if (existing) return { id: existing.id }

  const { data, error: e2 } = await supabase
    .from('corporate_tax_reports')
    .insert({ client_id: clientId, report_year: year, status: 'draft' })
    .select('id')
    .single()

  if (e2) throw new Error(`보고서 생성 실패: ${e2.message}`)

  revalidatePath('/reports/corporate-tax')
  return { id: data.id }
}
