-- v40: 위하고 수집 1단계 — 회사 매핑 + 스냅샷 저장소 (Phase 7)
--
-- 더존 위하고T Smart A 10 화면 응답(JSON)을 수동/확장프로그램으로 수집해
-- 아톰베이스에 쌓고, 검토 화면에서 인건비·감가상각 대조 룰로 검산한다.
--
-- wehago_companies : 위하고 회사코드(ccode) ↔ 아톰베이스 거래처(clients) 매핑
-- wehago_snapshots : 화면코드별 응답 스냅샷 (민감정보 마스킹 후 저장)
--
-- 중복 저장 방지: (ccode, screen_code, gisu, period_to, content_hash) UNIQUE.
-- 같은 데이터를 다시 붙여넣으면 23505 충돌 → "변경 없음"으로 처리.

CREATE TABLE IF NOT EXISTS wehago_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ccode text NOT NULL UNIQUE,                     -- 위하고 회사코드 (예: biz202511270023469)
  business_number text,                           -- no_biz (숫자만 저장)
  company_name text,                              -- nm_krcom
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  gisu int,
  acc_begin date,
  acc_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wehago_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ccode text NOT NULL,
  screen_code text NOT NULL,                      -- sacl0106 / swsa0105 / saas0106 / swbu0111
  gisu int,
  period_from text,                               -- 'YYYYMM' (없으면 NULL)
  period_to text,                                 -- 'YYYYMM' (누계 종료월)
  content_hash text NOT NULL,                     -- 마스킹+정규화된 payload의 sha256
  payload jsonb NOT NULL,                         -- 민감정보 마스킹 후 원본 응답
  source text NOT NULL DEFAULT 'manual',          -- 'manual' | 'extension'(2단계)
  collected_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wehago_snapshots_dedupe
  ON wehago_snapshots (ccode, screen_code, gisu, COALESCE(period_to, ''), content_hash);

ALTER TABLE wehago_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE wehago_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_wehago_companies" ON wehago_companies;
CREATE POLICY "authenticated_all_wehago_companies" ON wehago_companies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_wehago_snapshots" ON wehago_snapshots;
CREATE POLICY "authenticated_all_wehago_snapshots" ON wehago_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 검증 쿼리
-- SELECT count(*) FROM wehago_companies;
-- SELECT screen_code, count(*) FROM wehago_snapshots GROUP BY screen_code;
