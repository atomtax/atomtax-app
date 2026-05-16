-- v32: 매매사업자 종전 양도차익 수동 수정값 컬럼 추가
-- 자동계산값은 매번 동적 계산 (DB 저장 안 함)
-- 수동 수정한 값만 override 컬럼에 저장 (NULL이면 자동값 사용)
-- 종전 기납부세액은 컬럼 없음 (항상 자동계산)

ALTER TABLE trader_properties
  ADD COLUMN IF NOT EXISTS prior_transfer_income_override NUMERIC;

COMMENT ON COLUMN trader_properties.prior_transfer_income_override IS
  '종전 양도차익 수동 수정값. NULL이면 자동계산값(동일 거래처+동일 양도년도+이전 양도일 물건들의 양도차익 합) 사용.';

-- 검증
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'trader_properties'
--   AND column_name = 'prior_transfer_income_override';
--
-- SELECT COUNT(*) AS total,
--        COUNT(prior_transfer_income_override) AS not_null
-- FROM trader_properties;
-- 기대: not_null = 0
