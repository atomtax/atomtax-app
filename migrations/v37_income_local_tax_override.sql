-- v37: 종소세 보고서 지방소득세 수동 override
--
-- income_local_tax은 자동계산값 (납부할 총세액 × 10%)으로 매번 recalculate에
-- 덮어쓰여짐. 분리과세/특수 케이스 등으로 수동 조정이 필요한 경우를 위해
-- override 컬럼 추가 (PR #115).
--
-- 규칙:
--   - income_local_tax_override IS NULL → 자동계산 사용 (income_local_tax = floor(final_payable * 0.1))
--   - income_local_tax_override IS NOT NULL → override 값을 income_local_tax 로 사용
--
-- 매매사업자 prior_*_override 패턴(PR #79, #82)과 동일.

ALTER TABLE income_tax_reports
ADD COLUMN IF NOT EXISTS income_local_tax_override NUMERIC NULL;

COMMENT ON COLUMN income_tax_reports.income_local_tax_override IS
  '지방소득세 수동 override 값 (NULL이면 자동계산: 납부할 총세액 × 10%)';

-- 검증 쿼리
-- SELECT count(*) AS total, sum(case when income_local_tax_override IS NOT NULL then 1 else 0 end) AS override_count
-- FROM income_tax_reports;
