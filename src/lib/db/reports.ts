'use server'

import { createClient } from '@/lib/supabase/server'
import type { CorporateTaxReport, CorporateTaxReportInsert, CorporateTaxReportUpdate } from '@/types/database'

export async function getCorporateTaxReports(): Promise<CorporateTaxReport[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corporate_tax_reports')
    .select('*')
    .order('report_year', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as CorporateTaxReport[]
}

export async function getCorporateTaxReportsByClient(clientId: string): Promise<CorporateTaxReport[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corporate_tax_reports')
    .select('*')
    .eq('client_id', clientId)
    .order('report_year', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as CorporateTaxReport[]
}

export async function getCorporateTaxReportById(id: string): Promise<CorporateTaxReport | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corporate_tax_reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as CorporateTaxReport
}

export async function upsertCorporateTaxReport(report: CorporateTaxReportInsert): Promise<CorporateTaxReport> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corporate_tax_reports')
    .upsert(report, { onConflict: 'client_id,report_year' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as CorporateTaxReport
}

export async function updateCorporateTaxReport(id: string, report: CorporateTaxReportUpdate): Promise<CorporateTaxReport> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('corporate_tax_reports')
    .update({ ...report, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as CorporateTaxReport
}

export async function deleteCorporateTaxReport(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('corporate_tax_reports').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
