'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { IncomeTaxReport } from '@/types/database'

export async function ensureIncomeTaxReport(
  clientId: string,
  year: number
): Promise<{ id: string }> {
  const supabase = await createClient()

  // 1. Fast path: 이미 있으면 그 row 반환
  const { data: existing, error: e1 } = await supabase
    .from('income_tax_reports')
    .select('id')
    .eq('client_id', clientId)
    .eq('report_year', year)
    .maybeSingle()

  if (e1) throw new Error(`보고서 조회 실패: ${e1.message}`)
  if (existing) return { id: existing.id }

  // 2. 없으면 INSERT 시도. race condition 대비:
  //    Next.js prefetch + actual navigation이 page server component를 2회
  //    실행하면 둘 다 SELECT에서 "없음" 보고 INSERT 시도 → 두 번째가 UNIQUE
  //    제약(income_tax_reports_client_id_report_year_key) 위반으로 실패 →
  //    page throw → Application error (PR #113 수정).
  const { data, error: e2 } = await supabase
    .from('income_tax_reports')
    .insert({ client_id: clientId, report_year: year, status: 'draft' })
    .select('id')
    .single()

  if (data) return { id: data.id }

  // PostgreSQL unique_violation = 23505. 동시 호출의 다른 쪽이 INSERT 성공한 것
  // → 다시 SELECT 하여 winner row 반환.
  if (e2 && (e2.code === '23505' || /duplicate key/i.test(e2.message))) {
    const { data: winner, error: e3 } = await supabase
      .from('income_tax_reports')
      .select('id')
      .eq('client_id', clientId)
      .eq('report_year', year)
      .single()
    if (winner) return { id: winner.id }
    throw new Error(`보고서 조회 실패(race 재조회): ${e3?.message ?? 'unknown'}`)
  }

  throw new Error(`보고서 생성 실패: ${e2?.message ?? 'unknown'}`)
}

type SaveInput = Omit<IncomeTaxReport, 'id' | 'client_id' | 'created_at' | 'updated_at' | 'completed_at'>

export async function saveIncomeTaxReportFull(reportId: string, input: SaveInput) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('income_tax_reports')
    .update({
      updated_at: new Date().toISOString(),
      status: input.status,
      income_total: input.income_total,
      income_deduction: input.income_deduction,
      income_tax_base: input.income_tax_base,
      income_applied_rate: input.income_applied_rate,
      income_calculated_tax: input.income_calculated_tax,
      income_tax_reduction: input.income_tax_reduction,
      income_tax_credit: input.income_tax_credit,
      income_comprehensive_tax: input.income_comprehensive_tax,
      income_separate_tax: input.income_separate_tax,
      income_determined_total: input.income_determined_total,
      income_penalty_tax: input.income_penalty_tax,
      income_additional_tax: input.income_additional_tax,
      income_total_tax: input.income_total_tax,
      income_prepaid_tax: input.income_prepaid_tax,
      income_payable: input.income_payable,
      income_stock_deduct: input.income_stock_deduct,
      income_stock_add: input.income_stock_add,
      income_installment: input.income_installment,
      income_within_deadline: input.income_within_deadline,
      income_refund_offset: input.income_refund_offset,
      income_final_payable: input.income_final_payable,
      income_local_tax: input.income_local_tax,
      income_local_tax_override: input.income_local_tax_override,
      income_final_with_local: input.income_final_with_local,
      farm_special_tax: input.farm_special_tax,
      rural_total: input.rural_total,
      rural_deduction: input.rural_deduction,
      rural_tax_base: input.rural_tax_base,
      rural_calculated_tax: input.rural_calculated_tax,
      rural_tax_reduction: input.rural_tax_reduction,
      rural_tax_credit: input.rural_tax_credit,
      rural_comprehensive_tax: input.rural_comprehensive_tax,
      rural_separate_tax: input.rural_separate_tax,
      rural_determined_total: input.rural_determined_total,
      rural_penalty_tax: input.rural_penalty_tax,
      rural_additional_tax: input.rural_additional_tax,
      rural_total_tax: input.rural_total_tax,
      rural_prepaid_tax: input.rural_prepaid_tax,
      rural_payable: input.rural_payable,
      rural_stock_deduct: input.rural_stock_deduct,
      rural_stock_add: input.rural_stock_add,
      rural_installment: input.rural_installment,
      rural_within_deadline: input.rural_within_deadline,
      rural_final_payable: input.rural_final_payable,
      income_statement_filename: input.income_statement_filename,
      income_statement_period_label: input.income_statement_period_label,
      income_statement_summary: input.income_statement_summary,
      tax_credits: input.tax_credits,
      tax_reductions: input.tax_reductions,
      is_sincere_filing: input.is_sincere_filing,
      additional_notes: input.additional_notes,
      conclusion_notes: input.conclusion_notes,
      conclusion_sections: input.conclusion_sections,
    })
    .eq('id', reportId)
    .select('id, client_id')
    .single()

  if (error) {
    // PostgreSQL 42703 = undefined_column. 마이그레이션 누락 케이스 친화적 메시지 (PR #116).
    if (error.code === '42703' || /column .* does not exist/i.test(error.message)) {
      throw new Error(
        `DB 마이그레이션이 필요합니다 — Supabase SQL 에디터에서 최신 migrations/v*.sql 을 실행해 주세요. (원본 에러: ${error.message})`,
      )
    }
    throw new Error(`보고서 저장 실패: ${error.message}`)
  }

  revalidatePath('/reports/income-tax')
  if (data.client_id) revalidatePath(`/reports/income-tax/${data.client_id}`)
}
