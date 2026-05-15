-- ====================================================
-- v28: 종합소득세 보고서에 농어촌특별세(농특세) 컬럼 추가
-- ====================================================
-- 농특세는 사용자가 홈택스 결정세액에서 직접 입력하는 단일 값.
-- 기존 rural_* 컬럼 (농특세 세부 breakdown) 은 그대로 유지.
-- 본 컬럼은 PDF 최종 합계에 더해지는 단일 값.

ALTER TABLE income_tax_reports
  ADD COLUMN IF NOT EXISTS farm_special_tax NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN income_tax_reports.farm_special_tax IS
  '농어촌특별세 최종 납부 세액 (홈택스 결정세액의 농특세 컬럼). 기본 0';

-- 검증: 컬럼 존재 + 기존 행 영향 없음
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'income_tax_reports'
  AND column_name = 'farm_special_tax';

SELECT COUNT(*) AS total,
       SUM(CASE WHEN farm_special_tax = 0 THEN 1 ELSE 0 END) AS zero
FROM income_tax_reports;
