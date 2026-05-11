-- ============================================================
-- v20a: 매매사업자 시스템 재구성
-- Supabase SQL Editor에서 실행하세요
-- 사전 조건: v20_drop_old_traders.sql 실행 완료 (trader_inventory, expenses 삭제됨)
-- ============================================================

-- 1. 물건 마스터 테이블
CREATE TABLE IF NOT EXISTS trader_properties (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- 기본 정보
  property_name               TEXT NOT NULL,
  display_order               INTEGER NOT NULL DEFAULT 0,

  -- 금액 (필요경비 합산 결과 — v20b에서 본격 사용)
  acquisition_amount          NUMERIC(20,2) NOT NULL DEFAULT 0,
  other_expenses              NUMERIC(20,2) NOT NULL DEFAULT 0,

  -- 양도 정보
  transfer_amount             NUMERIC(20,2) NOT NULL DEFAULT 0,
  acquisition_date            DATE,
  transfer_date               DATE,

  -- 자동 계산
  transfer_income             NUMERIC(20,2) NOT NULL DEFAULT 0,
  filing_deadline             DATE,

  -- 세금 (v20b 세금계산 버튼에서 입력)
  prepaid_income_tax          NUMERIC(20,2) NOT NULL DEFAULT 0,
  prepaid_local_tax           NUMERIC(20,2) NOT NULL DEFAULT 0,

  -- 부가 정보
  location                    TEXT,
  is_85_over                  BOOLEAN NOT NULL DEFAULT FALSE,
  comparison_taxation         BOOLEAN NOT NULL DEFAULT FALSE,

  -- 진행단계 (5단계)
  progress_status             TEXT NOT NULL DEFAULT '미확인'
                              CHECK (progress_status IN ('미확인', '확인', '위하고입력', '고객안내', '신고완료')),

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 필요경비 상세 테이블 (v20b에서 본격 사용)
CREATE TABLE IF NOT EXISTS trader_property_expenses (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id                 UUID NOT NULL REFERENCES trader_properties(id) ON DELETE CASCADE,

  row_no                      INTEGER NOT NULL,

  expense_name                TEXT,
  category                    TEXT NOT NULL DEFAULT '취득가액'
                              CHECK (category IN ('취득가액', '기타필요경비')),
  amount                      NUMERIC(20,2) NOT NULL DEFAULT 0,

  predeclaration_allowed      BOOLEAN NOT NULL DEFAULT TRUE,
  income_tax_allowed          BOOLEAN NOT NULL DEFAULT TRUE,

  memo                        TEXT,

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(property_id, row_no)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_trader_properties_client    ON trader_properties(client_id);
CREATE INDEX IF NOT EXISTS idx_trader_properties_progress  ON trader_properties(progress_status);
CREATE INDEX IF NOT EXISTS idx_trader_expenses_property    ON trader_property_expenses(property_id);

-- updated_at 트리거 (update_updated_at_column 함수는 기존 마이그레이션에서 생성되어 있음)
DROP TRIGGER IF EXISTS update_trader_properties_updated_at ON trader_properties;
CREATE TRIGGER update_trader_properties_updated_at
  BEFORE UPDATE ON trader_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trader_expenses_updated_at ON trader_property_expenses;
CREATE TRIGGER update_trader_expenses_updated_at
  BEFORE UPDATE ON trader_property_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책 (CLAUDE.md 10절 — 새 테이블마다 필수)
ALTER TABLE trader_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON trader_properties;
CREATE POLICY "authenticated_full_access" ON trader_properties
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE trader_property_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_full_access" ON trader_property_expenses;
CREATE POLICY "authenticated_full_access" ON trader_property_expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 검증 쿼리
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('trader_properties', 'trader_property_expenses')
ORDER BY table_name, ordinal_position;
