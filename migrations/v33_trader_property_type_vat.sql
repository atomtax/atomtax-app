-- v33: 매매사업자 물건종류 + 부가세 컬럼 추가
-- 1. property_type: 물건 종류 (아파트/빌라/다세대/다가구/오피스텔/기타) — 사용자 직접 선택
-- 2. vat_amount: 부가세 (사용자 직접 입력) — 양도가액에서 차감하여 차감 후 양도가액 산출

ALTER TABLE trader_properties
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS vat_amount NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN trader_properties.property_type IS
  '물건 종류 (아파트/빌라/다세대/다가구/오피스텔/기타). 사용자 드롭다운 선택.';

COMMENT ON COLUMN trader_properties.vat_amount IS
  '부가세 (사용자 직접 입력). 양도가액에서 차감하여 차감 후 양도가액 산출 및 양도소득 계산.';

-- 검증
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'trader_properties'
--   AND column_name IN ('property_type', 'vat_amount');
--
-- SELECT COUNT(*) AS total,
--        SUM(CASE WHEN vat_amount IS NULL THEN 1 ELSE 0 END) AS vat_null,
--        SUM(CASE WHEN vat_amount = 0 THEN 1 ELSE 0 END) AS vat_zero
-- FROM trader_properties;
-- 기대: vat_null = 0, vat_zero = 전체
