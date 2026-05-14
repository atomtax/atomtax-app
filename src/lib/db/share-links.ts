import 'server-only'

import { createAnonClient, createClient } from '@/lib/supabase/server'

export type ReportType = 'income_tax' | 'corporate_tax' | 'vat'

export interface ShareLink {
  token: string
  report_type: ReportType
  report_id: string
  client_id: string
  created_at: string
  expires_at: string
}

interface ShareLinkRow {
  token: string
  report_type: string
  report_id: string
  client_id: string
  created_at: string
  expires_at: string
}

/**
 * 보고서 공유 링크 조회 또는 생성 — 직원이 호출.
 * - 활성 링크가 있으면 그대로 반환 (재생성 안 함, URL 일관성)
 * - 만료된 행이 있으면 삭제 후 새로 생성
 */
export async function getOrCreateShareLink(
  reportType: ReportType,
  reportId: string,
  clientId: string,
): Promise<ShareLink> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('report_share_links')
    .select('*')
    .eq('report_type', reportType)
    .eq('report_id', reportId)
    .maybeSingle()

  if (existing) {
    const row = existing as ShareLinkRow
    if (new Date(row.expires_at) > new Date()) {
      return toShareLink(row)
    }
    await supabase.from('report_share_links').delete().eq('token', row.token)
  }

  const { data, error } = await supabase
    .from('report_share_links')
    .insert({
      report_type: reportType,
      report_id: reportId,
      client_id: clientId,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`공유 링크 생성 실패: ${error?.message ?? 'unknown'}`)
  }
  return toShareLink(data as ShareLinkRow)
}

/**
 * 토큰으로 보고서 정보 조회 (공유 페이지에서 사용).
 * - anon role 사용 (RLS 의 만료 필터 적용)
 * - 만료/없는 토큰은 null
 */
export async function getReportByToken(token: string): Promise<{
  reportType: ReportType
  reportId: string
  clientId: string
} | null> {
  const supabase = await createAnonClient()
  const { data } = await supabase
    .from('report_share_links')
    .select('report_type, report_id, client_id, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!data) return null
  const row = data as Pick<
    ShareLinkRow,
    'report_type' | 'report_id' | 'client_id' | 'expires_at'
  >
  if (new Date(row.expires_at) < new Date()) return null

  return {
    reportType: row.report_type as ReportType,
    reportId: row.report_id,
    clientId: row.client_id,
  }
}

/**
 * 만료된 공유 링크 일괄 삭제 (Cron 호출용).
 * service role 클라이언트 사용 — RLS 우회.
 */
export async function cleanupExpiredShareLinks(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('report_share_links')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('token')

  if (error) throw new Error(`만료 토큰 삭제 실패: ${error.message}`)
  return data?.length ?? 0
}

function toShareLink(row: ShareLinkRow): ShareLink {
  return {
    token: row.token,
    report_type: row.report_type as ReportType,
    report_id: row.report_id,
    client_id: row.client_id,
    created_at: row.created_at,
    expires_at: row.expires_at,
  }
}
