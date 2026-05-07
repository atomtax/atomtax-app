-- v17: corporate_tax_reports 테이블 새 스키마로 재생성
-- 기존 데이터가 없는 경우(0건)에만 실행할 것.
-- 실행 전 반드시 SELECT COUNT(*) FROM corporate_tax_reports; 로 확인.

-- 1단계: 기존 테이블 삭제
DROP TABLE IF EXISTS corporate_tax_reports CASCADE;

-- 2단계: 새 스키마로 생성
CREATE TABLE corporate_tax_reports (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                     UUID REFERENCES clients(id) ON DELETE SET NULL,

  report_year                   INTEGER NOT NULL,
  status                        VARCHAR(20) NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'completed')),

  income_statement_filename     TEXT,
  income_statement_period_label TEXT,
  income_statement_summary      JSONB,

  revenue                       NUMERIC(20,2),
  net_income                    NUMERIC(20,2),

  calculated_tax                NUMERIC(20,2) NOT NULL DEFAULT 0,
  determined_tax                NUMERIC(20,2) NOT NULL DEFAULT 0,
  local_tax                     NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_special_tax             NUMERIC(20,2) NOT NULL DEFAULT 0,
  prepaid_tax                   NUMERIC(20,2) NOT NULL DEFAULT 0,
  final_tax                     NUMERIC(20,2) NOT NULL DEFAULT 0,

  current_loss                  NUMERIC(20,2) NOT NULL DEFAULT 0,
  carryover_loss                NUMERIC(20,2) NOT NULL DEFAULT 0,

  tax_credits                   JSONB NOT NULL DEFAULT '[]',
  tax_reductions                JSONB NOT NULL DEFAULT '[]',

  is_sincere_filing             BOOLEAN NOT NULL DEFAULT FALSE,
  additional_notes              TEXT,
  conclusion_notes              TEXT,

  completed_at                  TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(client_id, report_year)
);

-- 3단계: updated_at 자동 갱신 트리거
CREATE TRIGGER update_corporate_tax_reports_updated_at
  BEFORE UPDATE ON corporate_tax_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4단계: 검증
SELECT COUNT(*) AS row_count FROM corporate_tax_reports;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'corporate_tax_reports'
ORDER BY ordinal_position;
