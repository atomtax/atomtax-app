-- v34: 종전 기납부 세액 수동 수정값 컬럼 추가
-- prior_transfer_income_override (v32)와 동일 패턴
-- 자동계산값은 매번 동적 계산 (DB 저장 안 함)
-- 수동 수정한 값만 override 컬럼에 저장 (NULL이면 자동값 사용)

ALTER TABLE trader_properties
  ADD COLUMN IF NOT EXISTS prior_prepaid_income_tax_override NUMERIC,
  ADD COLUMN IF NOT EXISTS prior_prepaid_local_tax_override NUMERIC;

COMMENT ON COLUMN trader_properties.prior_prepaid_income_tax_override IS
  '종전 기납부 종합소득세 수동 수정값. NULL이면 자동계산값 사용.';

COMMENT ON COLUMN trader_properties.prior_prepaid_local_tax_override IS
  '종전 기납부 지방소득세 수동 수정값. NULL이면 자동계산값 사용.';

-- 검증
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'trader_properties'
--   AND column_name IN ('prior_prepaid_income_tax_override', 'prior_prepaid_local_tax_override');
--
-- SELECT COUNT(*) AS total,
--        COUNT(prior_prepaid_income_tax_override) AS income_override_not_null,
--        COUNT(prior_prepaid_local_tax_override)  AS local_override_not_null
-- FROM trader_properties;
-- 기대: 두 override 모두 0 (신규 컬럼이므로)
