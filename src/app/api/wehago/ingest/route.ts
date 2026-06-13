/**
 * 위하고 확장 수신 API (Phase 7 / 2단계-A)
 *
 * 크롬 확장프로그램이 위하고 응답을 POST로 보내는 창구.
 * - 확장 → 아톰베이스 방향 수신만. 위하고로는 아무것도 보내지 않는다.
 * - 직원별 고정 토큰(x-wehago-token)으로 인증. 로그인 세션 밖에서 호출됨.
 * - 수집/마스킹/해시 dedupe/거래처 매칭은 1단계 ingest 코어 재사용.
 *
 * 미들웨어 우회 대상이지만 쓰기 API이므로 토큰 인증 필수.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ingestWehagoData } from '@/lib/wehago/ingest'
import { hashToken } from '@/lib/wehago/token'
import type { Json } from '@/lib/wehago/types'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 2 * 1024 * 1024 // 2MB

/** CORS 헤더 — Origin은 환경변수로만 허용 (절대 '*' 금지) */
function corsHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-wehago-token',
    Vary: 'Origin',
  }
  const origin = process.env.WEHAGO_EXTENSION_ORIGIN
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders()

  // 1. 토큰 헤더
  const token = request.headers.get('x-wehago-token')
  if (!token) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401, headers })
  }

  // 2. 본문 크기 상한 → 파싱
  const raw = await request.text()
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'payload too large' }, { status: 413, headers })
  }

  let body: { url?: string; payload?: Json }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400, headers })
  }
  if (!body.url || body.payload === undefined) {
    return NextResponse.json(
      { ok: false, error: 'url and payload required' },
      { status: 400, headers },
    )
  }

  const supabase = await createClient()

  // 3. 토큰 검증 — token_hash 단일 조건 조회(UNIQUE) 후 is_active 확인 (.or() 금지)
  const { data: tokenRow } = await supabase
    .from('wehago_ingest_tokens')
    .select('id, label, is_active')
    .eq('token_hash', hashToken(token))
    .maybeSingle()

  if (!tokenRow || !tokenRow.is_active) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401, headers })
  }

  // 4. last_used_at 갱신 (실패해도 무시)
  void supabase
    .from('wehago_ingest_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)

  // 5. ingest 코어 재사용
  const result = await ingestWehagoData(supabase, {
    url: body.url,
    payload: body.payload,
    source: 'extension',
    ingestLabel: tokenRow.label,
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers })
}
