/**
 * 위하고 수신 토큰 조회 (Phase 7 / 2단계-A)
 * token_hash는 절대 노출하지 않는다 — 관리 화면용 비밀 제외 뷰.
 */

import { createClient } from '@/lib/supabase/server'

export interface WehagoTokenView {
  id: string
  label: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export async function fetchWehagoTokens(): Promise<WehagoTokenView[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wehago_ingest_tokens')
    .select('id, label, is_active, last_used_at, created_at')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as WehagoTokenView[]
}
