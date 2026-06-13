-- v41: 위하고 확장 수신용 직원별 토큰 (Phase 7 / 2단계-A)
--
-- 크롬 확장프로그램이 POST /api/wehago/ingest 로 데이터를 보낼 때 인증.
-- 직원별 고정 토큰 — 한 토큰이 유출돼도 그것만 폐기, 출처 추적 가능.
-- 토큰 원문은 저장하지 않고 sha256 해시만 저장(비밀번호 저장 원칙).

CREATE TABLE wehago_ingest_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,                       -- 직원 식별용 메모 (예: "김이영-사무실PC")
  token_hash text NOT NULL UNIQUE,           -- 토큰 원문의 sha256 (원문은 저장하지 않음)
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wehago_ingest_tokens ENABLE ROW LEVEL SECURITY;

-- 인증된 직원(로그인)만 토큰 관리. 수신 API는 service role로 검증하므로 별도.
CREATE POLICY "authenticated_all_wehago_tokens" ON wehago_ingest_tokens
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 스냅샷에 출처 토큰 라벨 기록용 컬럼 추가 (어느 직원 PC에서 왔는지 추적)
ALTER TABLE wehago_snapshots ADD COLUMN IF NOT EXISTS ingest_label text;

-- 검증 쿼리
-- SELECT label, is_active, last_used_at FROM wehago_ingest_tokens;
-- SELECT source, ingest_label, count(*) FROM wehago_snapshots GROUP BY source, ingest_label;
