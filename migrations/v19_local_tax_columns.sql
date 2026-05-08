-- 종합소득세 보고서에 지방소득세 컬럼 추가
ALTER TABLE income_tax_reports
  ADD COLUMN IF NOT EXISTS income_local_tax NUMERIC(20,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS income_final_with_local NUMERIC(20,2) NOT NULL DEFAULT 0;

-- 검증
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'income_tax_reports'
  AND column_name LIKE '%local%';
