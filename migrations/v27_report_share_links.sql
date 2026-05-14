-- ====================================================
-- v27: 보고서 외부 공유 링크 테이블
-- ====================================================
-- 원본 보고서 데이터(income_tax_reports / corporate_tax_reports 등)는 절대 건드리지 않음.
-- 토큰 1개 = 보고서 1개 외부 공유 (30일 만료, 매일 cron 으로 정리).

CREATE TABLE IF NOT EXISTS report_share_links (
  token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL,    -- 'income_tax' | 'corporate_tax' | 'vat' (확장 가능)
  report_id   UUID NOT NULL,           -- 원본 보고서 PK (FK 안 검 — 보고서 타입 확장성)
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  CONSTRAINT unique_active_report UNIQUE(report_type, report_id)
);

CREATE INDEX IF NOT EXISTS idx_share_links_expires
  ON report_share_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_links_report
  ON report_share_links(report_type, report_id);

-- RLS
ALTER TABLE report_share_links ENABLE ROW LEVEL SECURITY;

-- 인증된 직원: 모든 작업
CREATE POLICY "authenticated_all_share_links" ON report_share_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 익명(외부 고객): 만료 안 된 토큰만 SELECT
CREATE POLICY "anon_read_active_share_links" ON report_share_links
  FOR SELECT TO anon USING (expires_at > NOW());

-- 검증
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'report_share_links'
ORDER BY ordinal_position;
