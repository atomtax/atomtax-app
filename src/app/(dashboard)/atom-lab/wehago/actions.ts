'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ingestWehagoData, type IngestResult } from '@/lib/wehago/ingest'

/**
 * 위하고 데이터 수집 서버 액션 (Phase 7 / 1단계).
 * 코어 로직은 ingestWehagoData에 위임 — 폼/API 양쪽에서 재사용.
 */
export async function collectWehagoAction(input: {
  url: string
  jsonText: string
}): Promise<IngestResult> {
  const supabase = await createClient()
  const result = await ingestWehagoData(supabase, input)

  // 저장에 성공한 경우에만 목록 갱신 (마지막 1회)
  if (result.ok && result.result !== '변경 없음') {
    revalidatePath('/atom-lab/wehago')
  }

  return result
}
