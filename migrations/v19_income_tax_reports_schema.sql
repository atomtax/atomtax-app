-- ====================================================
-- v19: 종합소득세 보고서 테이블
-- ====================================================

CREATE TABLE income_tax_reports (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                       UUID REFERENCES clients(id) ON DELETE SET NULL,

  report_year                     INTEGER NOT NULL,
  status                          VARCHAR(20) NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'completed')),

  -- 종합소득세 (income_*)
  income_total                    NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_deduction                NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_tax_base                 NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_applied_rate             NUMERIC(5,2)  NOT NULL DEFAULT 0,
  income_calculated_tax           NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_tax_reduction            NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_tax_credit               NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_comprehensive_tax        NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_separate_tax             NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_determined_total         NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_penalty_tax              NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_additional_tax           NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_total_tax                NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_prepaid_tax              NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_payable                  NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_stock_deduct             NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_stock_add                NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_installment              NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_within_deadline          NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_refund_offset            NUMERIC(20,2) NOT NULL DEFAULT 0,
  income_final_payable            NUMERIC(20,2) NOT NULL DEFAULT 0,

  -- 농어촌특별세 (rural_*)
  rural_total                     NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_deduction                 NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_tax_base                  NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_calculated_tax            NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_tax_reduction             NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_tax_credit                NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_comprehensive_tax         NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_separate_tax              NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_determined_total          NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_penalty_tax               NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_additional_tax            NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_total_tax                 NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_prepaid_tax               NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_payable                   NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_stock_deduct              NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_stock_add                 NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_installment               NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_within_deadline           NUMERIC(20,2) NOT NULL DEFAULT 0,
  rural_final_payable             NUMERIC(20,2) NOT NULL DEFAULT 0,

  -- 세액공제/감면 동적 항목 (v19c)
  tax_credits                     JSONB NOT NULL DEFAULT '[]',
  tax_reductions                  JSONB NOT NULL DEFAULT '[]',

  -- 메모 (v19c)
  is_sincere_filing               BOOLEAN NOT NULL DEFAULT FALSE,
  additional_notes                TEXT,
  conclusion_notes                TEXT,

  completed_at                    TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(client_id, report_year)
);

-- RLS
ALTER TABLE income_tax_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_full_access" ON income_tax_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_at 트리거
CREATE TRIGGER update_income_tax_reports_updated_at
  BEFORE UPDATE ON income_tax_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스
CREATE INDEX idx_income_tax_reports_client_year ON income_tax_reports(client_id, report_year);
CREATE INDEX idx_income_tax_reports_status ON income_tax_reports(status);

-- 검증
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'income_tax_reports'
ORDER BY ordinal_position;
