'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { IncomeStatementSummary } from '@/types/database'

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

  return { id: data.id }
}

interface SaveReportBasicInput {
  reportId: string
  income_statement_filename?: string | null
  income_statement_period_label?: string | null
  income_statement_summary?: IncomeStatementSummary | null
  revenue?: number | null
  net_income?: number | null
}

export async function saveCorporateTaxReportBasic(input: SaveReportBasicInput) {
  const supabase = await createClient()

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.income_statement_filename !== undefined)
    updates.income_statement_filename = input.income_statement_filename
  if (input.income_statement_period_label !== undefined)
    updates.income_statement_period_label = input.income_statement_period_label
  if (input.income_statement_summary !== undefined)
    updates.income_statement_summary = input.income_statement_summary
  if (input.revenue !== undefined) updates.revenue = input.revenue
  if (input.net_income !== undefined) updates.net_income = input.net_income

  const { data, error } = await supabase
    .from('corporate_tax_reports')
    .update(updates)
    .eq('id', input.reportId)
    .select('id, client_id')
    .single()

  if (error) throw new Error(`보고서 저장 실패: ${error.message}`)

  revalidatePath('/reports/corporate-tax')
  if (data.client_id) revalidatePath(`/reports/corporate-tax/${data.client_id}`)
}

interface SaveReportFullInput {
  reportId: string
  income_statement_filename?: string | null
  income_statement_period_label?: string | null
  income_statement_summary?: IncomeStatementSummary | null
  revenue?: number | null
  net_income?: number | null
  carryover_loss: number
  current_loss: number
  calculated_tax: number
  determined_tax: number
  local_tax: number
  rural_special_tax: number
  prepaid_tax: number
  final_tax: number
  tax_credits: import('@/types/database').TaxCredit[]
  tax_reductions: import('@/types/database').TaxReduction[]
  is_sincere_filing: boolean
  additional_notes: string | null
  conclusion_notes: string | null
}

export async function saveCorporateTaxReportFull(input: SaveReportFullInput) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('corporate_tax_reports')
    .update({
      updated_at: new Date().toISOString(),
      income_statement_filename: input.income_statement_filename ?? null,
      income_statement_period_label: input.income_statement_period_label ?? null,
      income_statement_summary: input.income_statement_summary ?? null,
      revenue: input.revenue ?? null,
      net_income: input.net_income ?? null,
      carryover_loss: input.carryover_loss,
      current_loss: input.current_loss,
      calculated_tax: input.calculated_tax,
      determined_tax: input.determined_tax,
      local_tax: input.local_tax,
      rural_special_tax: input.rural_special_tax,
      prepaid_tax: input.prepaid_tax,
      final_tax: input.final_tax,
      tax_credits: input.tax_credits,
      tax_reductions: input.tax_reductions,
      is_sincere_filing: input.is_sincere_filing,
      additional_notes: input.additional_notes,
      conclusion_notes: input.conclusion_notes,
    })
    .eq('id', input.reportId)
    .select('id, client_id')
    .single()

  if (error) throw new Error(`보고서 저장 실패: ${error.message}`)

  revalidatePath('/reports/corporate-tax')
  if (data.client_id) revalidatePath(`/reports/corporate-tax/${data.client_id}`)
}
