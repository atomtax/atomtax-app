-- v35: 매매사업자 물건 filing_deadline 백필
--
-- 배경: 일괄 업로드(trader-bulk-upload.ts) 액션이 filing_deadline을 계산해서
-- INSERT하지 않아 NULL로 저장됨 → 체크리스트(filterByMonth)에서 누락.
-- PR #94에서 액션 자체는 수정했으나 기존 NULL 데이터는 백필 필요.
--
-- calculateFilingDeadline 로직(src/lib/calculators/property.ts):
--   양도일이 속한 달의 말일 + 2개월
--   예: 2026-03-15 → 2026-03-31 + 2개월 = 2026-05-31
--       2025-12-25 → 2025-12-31 + 2개월 = 2026-02-28
--
-- SQL 표현:
--   date_trunc('month', transfer_date) + interval '3 month' - interval '1 day'
--   = (양도일 속한 달 1일) + 3개월 - 1일 = (양도일 속한 달 + 2개월) 말일

UPDATE trader_properties
SET filing_deadline = (
  date_trunc('month', transfer_date::timestamp)
  + interval '3 month'
  - interval '1 day'
)::date,
updated_at = NOW()
WHERE transfer_date IS NOT NULL
  AND filing_deadline IS NULL;

-- 검증 쿼리 (실행 후 확인용)
-- SELECT property_name, transfer_date, filing_deadline
-- FROM trader_properties
-- WHERE transfer_date IS NOT NULL
-- ORDER BY filing_deadline DESC
-- LIMIT 20;
