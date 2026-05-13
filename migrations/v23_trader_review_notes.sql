-- ====================================================
-- v23: 매매사업자 결산참고 메모 테이블
-- ====================================================
-- 매출액/매출원가/기말재고/종소세/지방세는 trader_properties + trader_property_expenses 실시간 집계.
-- 이 테이블은 사용자 메모 + 확인여부만 저장.

CREATE TABLE trader_review_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_year  INTEGER NOT NULL,
  memo         TEXT NOT NULL DEFAULT '',
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, report_year)
);

-- RLS
ALTER TABLE trader_review_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access" ON trader_review_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at 트리거 (기존 update_updated_at_column 함수 사용)
CREATE TRIGGER update_trader_review_notes_updated_at
  BEFORE UPDATE ON trader_review_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_trader_review_notes_client_year
  ON trader_review_notes(client_id, report_year);
CREATE INDEX idx_trader_review_notes_year
  ON trader_review_notes(report_year);

-- 검증
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'trader_review_notes'
ORDER BY ordinal_position;
