-- v30: 기장고객 개업일 컬럼 추가
-- 결산참고 창업감면 만 35세 미만 조건 판단에 사용
-- 형식: DATE (YYYY-MM-DD)

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS opening_date DATE;

COMMENT ON COLUMN clients.opening_date IS
  '기장고객 개업일 (사업자등록증상의 개업연월일). 창업감면 만 35세 미만 조건 판단용.';

-- 검증
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'clients' AND column_name = 'opening_date';
--
-- SELECT COUNT(*) AS total,
--        COUNT(opening_date) AS has_date,
--        SUM(CASE WHEN opening_date IS NULL THEN 1 ELSE 0 END) AS null_count
-- FROM clients;
