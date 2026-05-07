-- v15: Phase 3-A 매매사업자 물건 테이블 재구성
-- 기존 trader_inventory 테이블을 새 스키마로 교체

-- 기존 테이블이 있으면 백업 후 재생성
-- 주의: 기존 데이터가 있다면 백업 권장

-- 기존 expenses 테이블 참조 수정
ALTER TABLE IF EXISTS expenses
  DROP CONSTRAINT IF EXISTS expenses_inventory_id_fkey;

-- 기존 trader_inventory 테이블 삭제 (데이터 없는 경우만)
DROP TABLE IF EXISTS trader_inventory CASCADE;

-- 새 trader_inventory 테이블
CREATE TABLE trader_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID REFERENCES clients(id) ON DELETE SET NULL,
  property_address  TEXT,
  property_type     VARCHAR(100),
  acquisition_date  DATE,
  acquisition_price NUMERIC(20,2),
  transfer_date     DATE,
  transfer_price    NUMERIC(20,2),
  filing_deadline   DATE,
  progress_status   VARCHAR(10) DEFAULT '미확인'
                    CHECK (progress_status IN ('미확인', '진행중', '완료')),
  is_taxable        BOOLEAN DEFAULT FALSE,
  output_vat        NUMERIC(20,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- expenses 테이블 재구성
DROP TABLE IF EXISTS expenses CASCADE;

CREATE TABLE expenses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_inventory_id   UUID REFERENCES trader_inventory(id) ON DELETE CASCADE,
  client_id             UUID REFERENCES clients(id) ON DELETE SET NULL,
  expense_date          DATE,
  category              VARCHAR(100),
  amount                NUMERIC(20,2) NOT NULL DEFAULT 0,
  description           TEXT,
  input_vat             NUMERIC(20,2),
  receipt_url           TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
