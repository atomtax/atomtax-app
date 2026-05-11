-- ============================================================
-- v20e: 매매사업자 물건에 토지면적/건물면적 컬럼 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

ALTER TABLE trader_properties
  ADD COLUMN IF NOT EXISTS land_area     NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS building_area NUMERIC(15,2) NOT NULL DEFAULT 0;

-- 검증
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trader_properties'
  AND column_name IN ('land_area', 'building_area')
ORDER BY column_name;
