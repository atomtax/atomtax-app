'use server'

import { createClient } from '@/lib/supabase/server'
import type { IncomeClientWithReport } from '@/types/database'

export async function listIncomeClientsWithReports(
  year: number
): Promise<IncomeClientWithReport[]> {
  const supabase = await createClient()

  const { data: clients, error: e1 } = await supabase
    .from('clients')
    .select('id, company_name, representative, business_number, manager')
    .eq('business_type_category', '개인')
    .eq('is_terminated', false)
    .order('company_name')

  if (e1) throw new Error(`개인 고객 조회 실패: ${e1.message}`)
  if (!clients || clients.length === 0) return []

  const clientIds = clients.map((c) => c.id)
  const { data: reports, error: e2 } = await supabase
    .from('income_tax_reports')
    .select('id, client_id, status, completed_at, updated_at')
    .eq('report_year', year)
    .in('client_id', clientIds)

  if (e2) {
    console.error('종합소득세 보고서 조회 실패 (마이그레이션 필요할 수 있음):', e2.message)
    return clients.map((client) => ({ client, report: null }))
  }

  const reportMap = new Map((reports ?? []).map((r) => [r.client_id as string, r]))

  return clients.map((client) => ({
    client,
    report: reportMap.get(client.id) ?? null,
  }))
}

export async function listIncomeManagers(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('manager')
    .eq('business_type_category', '개인')
    .eq('is_terminated', false)
    .not('manager', 'is', null)

  if (error) throw new Error(`담당자 조회 실패: ${error.message}`)

  const set = new Set<string>()
  for (const row of data ?? []) {
    const m = (row.manager ?? '').trim()
    if (m) set.add(m)
  }
  return Array.from(set).sort()
}
