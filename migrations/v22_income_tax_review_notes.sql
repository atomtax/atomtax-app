-- ====================================================
-- v22: 결산참고 메모 테이블 (종합소득세 일반사업자 참고용)
-- ====================================================
-- 메인 표의 자동 계산 값(매출액/세액 등)은 income_tax_reports를 실시간 조회.
-- 이 테이블은 사용자가 직접 입력하는 메모와 확인여부만 저장.

CREATE TABLE income_tax_review_notes (
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
ALTER TABLE income_tax_review_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access" ON income_tax_review_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at 트리거 (기존 update_updated_at_column 함수 사용)
CREATE TRIGGER update_income_tax_review_notes_updated_at
  BEFORE UPDATE ON income_tax_review_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_income_tax_review_notes_client_year
  ON income_tax_review_notes(client_id, report_year);
CREATE INDEX idx_income_tax_review_notes_year
  ON income_tax_review_notes(report_year);

-- 검증
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'income_tax_review_notes'
ORDER BY ordinal_position;
