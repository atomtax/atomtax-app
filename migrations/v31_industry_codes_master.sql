-- v31: 업종코드 마스터 데이터 테이블
-- 출처: 첨부 창감.xlsx (1,788건)
-- 용도: 결산참고 일반사업자 페이지의 창업감면(창감) / 중소기업특별세액감면(중특) 표시

CREATE TABLE IF NOT EXISTS industry_codes_master (
  industry_code VARCHAR(10) PRIMARY KEY,            -- 업종코드 (예: '11000', '930919', 앞 0 보존)

  -- 중소기업 특별 세액감면 (중특)
  mid_special_eligible CHAR(1),                     -- Z열: O/X
  mid_special_note TEXT,                            -- AA열: 비고

  -- 창업중소기업 감면 (창감)
  startup_eligible CHAR(1),                         -- AB열: O/X
  startup_start_date DATE,                          -- AC열: 창중감 가능 시작연월일
  startup_note TEXT,                                -- AD열: 비고

  -- 중기업 기준 (참고용)
  threshold_exceeded NUMERIC,                       -- AE열: 초과
  threshold_below NUMERIC,                          -- AF열: 이하
  min_employment INT,                               -- AG열: 창중감 최소고용인원

  -- 감면율
  mid_special_category VARCHAR(20),                 -- AH열: 중특감 분류 ('그외' 등)
  small_biz_reduction_rate NUMERIC,                 -- AI열: 소기업 감면율 (예: 0.3 = 30%)

  -- 업종 정보 (참고용)
  category_major VARCHAR(20),                       -- C열: 대분류 코드 (A, B, C...)
  category_major_name VARCHAR(100),                 -- D열: 대분류명
  business_description TEXT,                        -- K열: 세세분류명 (가장 구체적)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE industry_codes_master IS
  '업종코드별 창업감면/중소기업특별세액감면 마스터 데이터. 결산참고 페이지에서 활용.';

CREATE INDEX IF NOT EXISTS idx_industry_codes_startup
  ON industry_codes_master(startup_eligible) WHERE startup_eligible = 'O';

CREATE INDEX IF NOT EXISTS idx_industry_codes_mid_special
  ON industry_codes_master(mid_special_eligible) WHERE mid_special_eligible = 'O';

-- RLS
ALTER TABLE industry_codes_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_industry_codes" ON industry_codes_master
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_write_industry_codes" ON industry_codes_master
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_industry_codes" ON industry_codes_master
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 검증
-- SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'industry_codes_master';
-- 기대: 16개 컬럼 (PK + 비즈니스 13 + created_at, updated_at)
--
-- SELECT policyname FROM pg_policies WHERE tablename = 'industry_codes_master';
-- 기대: 3개 정책
