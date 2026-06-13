'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateToken, hashToken } from '@/lib/wehago/token'

export interface IssueTokenResult {
  ok: boolean
  /** 발급된 토큰 원문 — 이 응답에서 단 한 번만 노출 */
  token?: string
  error?: string
}

/** 토큰 발급 — 원문은 반환만, DB엔 해시만 저장 */
export async function issueWehagoTokenAction(
  label: string,
): Promise<IssueTokenResult> {
  const trimmed = label.trim()
  if (!trimmed) {
    return { ok: false, error: '라벨을 입력해 주세요 (예: 김이영-사무실PC)' }
  }

  const token = generateToken()
  const supabase = await createClient()
  const { error } = await supabase.from('wehago_ingest_tokens').insert({
    label: trimmed,
    token_hash: hashToken(token),
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/atom-lab/wehago')
  return { ok: true, token }
}

/** 토큰 비활성화 (삭제 아님 — 이력 보존) */
export async function deactivateWehagoTokenAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('wehago_ingest_tokens')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/atom-lab/wehago')
  return { ok: true }
}
