'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { detectClosingChanges } from '@/lib/closing/detect'
import { parseTpSalesExcel } from '@/lib/closing/tp-parse'
import type { ClosingTaxType, DetectSummary } from '@/lib/closing/types'

const PATH = '/atom-lab/closing'

export interface DetectActionResult {
  ok: boolean
  summary?: DetectSummary
  error?: string
}

/** 위하고 마감현황 응답 붙여넣기 → 변화 감지 */
export async function detectClosingAction(input: {
  taxType: ClosingTaxType
  jsonText: string
}): Promise<DetectActionResult> {
  let json: unknown
  try {
    json = JSON.parse(input.jsonText)
  } catch {
    return { ok: false, error: 'JSON 형식이 아닙니다. 마감현황 응답을 그대로 복사해 주세요.' }
  }

  const supabase = await createClient()
  try {
    const summary = await detectClosingChanges(supabase, { json, taxType: input.taxType })
    revalidatePath(PATH)
    return { ok: true, summary }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '감지 실패'
    return { ok: false, error: msg }
  }
}

export interface UploadTpResult {
  ok: boolean
  companyName?: string
  salesTotal?: number
  error?: string
}

/** TP 부가세 합계표 엑셀 업로드 (거래처 드롭다운 선택) */
export async function uploadTpSalesAction(formData: FormData): Promise<UploadTpResult> {
  const file = formData.get('file')
  const clientId = formData.get('clientId')

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: '엑셀 파일을 선택해 주세요.' }
  }
  if (typeof clientId !== 'string' || !clientId) {
    return { ok: false, error: '거래처를 선택해 주세요.' }
  }

  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name, business_number')
    .eq('id', clientId)
    .maybeSingle()

  if (!client) {
    return { ok: false, error: '선택한 거래처를 찾을 수 없습니다.' }
  }

  let agg
  try {
    agg = await parseTpSalesExcel(await file.arrayBuffer())
  } catch (e) {
    const msg = e instanceof Error ? e.message : '엑셀 파싱 실패'
    return { ok: false, error: msg }
  }

  const { error } = await supabase.from('tp_sales_snapshots').insert({
    business_number: (client.business_number ?? '').replace(/\D/g, '') || null,
    company_name: client.company_name,
    period_from: agg.period_from,
    period_to: agg.period_to,
    sales_tax_invoice: agg.sales_tax_invoice,
    sales_invoice: agg.sales_invoice,
    sales_cash_receipt: agg.sales_cash_receipt,
    sales_card: agg.sales_card,
    sales_export: agg.sales_export,
    sales_zeropay: agg.sales_zeropay,
    sales_total: agg.sales_total,
    purchase_tax_invoice: agg.purchase_tax_invoice,
    raw_rows: agg.raw_rows,
    client_id: client.id,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath(PATH)
  return { ok: true, companyName: client.company_name, salesTotal: agg.sales_total }
}

/** 마감 변화 확인 완료 처리 */
export async function markReviewedAction(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('closing_changes')
    .update({ is_reviewed: true })
    .eq('id', id)
  if (error) return { ok: false }
  revalidatePath(PATH)
  return { ok: true }
}
