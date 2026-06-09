-- v39 중복 인덱스 정리 + dead row VACUUM (PR #130 Phase A 진단 결과 반영)
--
-- 진단 (PERF-DIAGNOSIS.md):
--   - DB는 이미 충분히 인덱싱됨 (모든 테이블 seq_scan_pct < 20%, row_count < 2,000)
--   - 신규 인덱스 추가는 ROI 없음
--   - 단, UNIQUE 제약과 중복되는 일반 인덱스 2개 발견 → 제거
--
-- 실행 방법 (Supabase SQL Editor):
--   1) 아래 DROP INDEX 두 줄은 한 번에 실행 가능
--   2) VACUUM ANALYZE 다섯 줄은 트랜잭션 안에서 실행 불가 → 한 줄씩 따로 실행
--
-- 위험도: 매우 낮음 (UNIQUE 제약이 동일한 btree 인덱스를 이미 제공)

-- ─────────────────────────────────────────────────────────────
-- 1. 중복 인덱스 제거
-- ─────────────────────────────────────────────────────────────

-- income_tax_reports_client_id_report_year_key (UNIQUE) 가 동일한 인덱스를 이미 제공
DROP INDEX IF EXISTS public.idx_income_tax_reports_client_year;

-- unique_active_report (UNIQUE on (report_type, report_id)) 가 동일한 인덱스를 이미 제공
DROP INDEX IF EXISTS public.idx_share_links_report;

-- ─────────────────────────────────────────────────────────────
-- 2. 누적 dead row 정리 (선택) — 각 줄을 별도 실행
-- ─────────────────────────────────────────────────────────────
-- VACUUM ANALYZE public.adjustment_invoices;
-- VACUUM ANALYZE public.income_tax_reports;
-- VACUUM ANALYZE public.clients;
-- VACUUM ANALYZE public.trader_properties;
-- VACUUM ANALYZE public.trader_property_expenses;
