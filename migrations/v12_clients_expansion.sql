-- ============================================================
-- v12: clients 테이블 컬럼 추가 + FK 정책 변경
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. clients 테이블에 신규 컬럼 추가
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS email                    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_drive_folder_url  TEXT,
  ADD COLUMN IF NOT EXISTS trader_drive_folder_url  TEXT,
  ADD COLUMN IF NOT EXISTS resident_number          VARCHAR(20),
  ADD COLUMN IF NOT EXISTS business_category_code   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS postal_code              VARCHAR(10),
  ADD COLUMN IF NOT EXISTS supply_value             BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_value                BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initial_billing_month    VARCHAR(7),
  ADD COLUMN IF NOT EXISTS hometax_id               VARCHAR(255),
  ADD COLUMN IF NOT EXISTS hometax_password         TEXT;

-- 2. FK 정책: ON DELETE CASCADE → ON DELETE SET NULL
--    (고객 삭제 시 연결 데이터 삭제 대신 NULL 처리)

-- adjustment_invoices
ALTER TABLE adjustment_invoices
  DROP CONSTRAINT IF EXISTS adjustment_invoices_client_id_fkey;
ALTER TABLE adjustment_invoices
  ADD CONSTRAINT adjustment_invoices_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- corporate_tax_reports
ALTER TABLE corporate_tax_reports
  DROP CONSTRAINT IF EXISTS corporate_tax_reports_client_id_fkey;
ALTER TABLE corporate_tax_reports
  ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE corporate_tax_reports
  ADD CONSTRAINT corporate_tax_reports_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- trader_inventory
ALTER TABLE trader_inventory
  DROP CONSTRAINT IF EXISTS trader_inventory_client_id_fkey;
ALTER TABLE trader_inventory
  ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE trader_inventory
  ADD CONSTRAINT trader_inventory_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- documents (테이블이 존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_client_id_fkey;
    ALTER TABLE documents
      ADD CONSTRAINT documents_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- tax_invoices (테이블이 존재하는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tax_invoices') THEN
    ALTER TABLE tax_invoices DROP CONSTRAINT IF EXISTS tax_invoices_client_id_fkey;
    ALTER TABLE tax_invoices
      ADD CONSTRAINT tax_invoices_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;
