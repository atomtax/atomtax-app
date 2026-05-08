-- 종합소득세 보고서에 손익계산서 컬럼 추가
ALTER TABLE income_tax_reports
  ADD COLUMN IF NOT EXISTS income_statement_filename TEXT,
  ADD COLUMN IF NOT EXISTS income_statement_period_label TEXT,
  ADD COLUMN IF NOT EXISTS income_statement_summary JSONB;

-- 검증
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'income_tax_reports'
  AND column_name LIKE 'income_statement%';
