-- v38: trader_properties 세금 구분 컬럼 추가
--
-- 매매사업자 물건 각각에 세금 구분(매매사업자/양도소득세)을 부여.
--  - 매매사업자(기본): 현행 종소세 합산 흐름 그대로
--  - 양도소득세: 모든 세무 계산·합산·보고서에서 완전 제외, 체크리스트만 진행관리
--
-- 마이그레이션 직후 즉시 실행 필요. 미실행 시 PostgreSQL 42703 →
-- Next.js Server Components 모호 에러 (PR #114 회고).

ALTER TABLE trader_properties
ADD COLUMN IF NOT EXISTS tax_category TEXT NOT NULL DEFAULT '매매사업자'
CHECK (tax_category IN ('매매사업자', '양도소득세'));

COMMENT ON COLUMN trader_properties.tax_category IS
  '세금 구분. 매매사업자=종소세 합산 대상(기본), 양도소득세=계산/합산/보고서 제외, 체크리스트 진행관리만';

-- 검증 쿼리
-- SELECT tax_category, count(*) FROM trader_properties GROUP BY tax_category;
