-- v42: 위하고 마감감지 + TP 매출 스냅샷 (Phase 7 재설계)
--
-- 확장 가로채기(luna-ufo) 방식 폐기 → 세무사가 위하고 마감현황을 1회 조회한
-- 응답(common/make/master)을 붙여넣어 "마감 상태 변화"를 감지하는 방식으로 전환.
-- TP(홈택스) 부가세 합계표를 업로드해 신고매출을 집계(부가세 대조 다음 단계 대비).
--
-- 재실행 안전(idempotent): IF NOT EXISTS + DROP POLICY IF EXISTS.

-- 1) 마감 상태 스냅샷 (조회할 때마다 회사×세목×기간 단위로 관측 이력 누적)
CREATE TABLE IF NOT EXISTS closing_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_number text NOT NULL,          -- no_biz (숫자만)
  company_name text,                      -- nm_krcom
  cno text,                               -- 위하고 회사코드
  tax_type text NOT NULL,                 -- 'income'(종소/법인) | 'vat'(부가) 등
  period text,                            -- da_period 또는 dm_fndbegin~end
  is_closed boolean NOT NULL DEFAULT false,
  closed_at_raw text,                     -- str_6 원본 타임스탬프(YYYYMMDDHHMMSS)
  manager text,                           -- str_7
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_closing_snap_key
  ON closing_snapshots (business_number, tax_type, period, observed_at DESC);

-- 2) 마감 변화 이벤트 (결재 화면 "확인 필요" 목록)
CREATE TABLE IF NOT EXISTS closing_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_number text NOT NULL,
  company_name text,
  tax_type text NOT NULL,
  period text,
  change_type text NOT NULL,              -- 'new_closed' | 're_closed'
  prev_closed_at text,
  curr_closed_at text,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  is_reviewed boolean NOT NULL DEFAULT false,
  detected_at timestamptz NOT NULL DEFAULT now()
);

-- 3) TP 매출 스냅샷 (업로드 1건 = 한 거래처의 한 신고분 요약)
CREATE TABLE IF NOT EXISTS tp_sales_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_number text,
  company_name text,
  period_from text,                       -- 귀속 시작(YYYYMM)
  period_to text,                         -- 귀속 종료(YYYYMM)
  sales_tax_invoice bigint DEFAULT 0,     -- (매출)세금계산서 공급가액 합
  sales_invoice bigint DEFAULT 0,         -- (매출)계산서
  sales_cash_receipt bigint DEFAULT 0,    -- (매출)현금영수증
  sales_card bigint DEFAULT 0,            -- (매출)신용카드
  sales_export bigint DEFAULT 0,          -- 수출실적명세서
  sales_zeropay bigint DEFAULT 0,         -- (매출)제로페이
  sales_total bigint DEFAULT 0,           -- 위 합계 = 신고매출
  purchase_tax_invoice bigint DEFAULT 0,  -- (매입)세금계산서 (참고)
  raw_rows jsonb,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE closing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE closing_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tp_sales_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_closing_snap" ON closing_snapshots;
CREATE POLICY "auth_all_closing_snap" ON closing_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_closing_changes" ON closing_changes;
CREATE POLICY "auth_all_closing_changes" ON closing_changes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_tp_sales" ON tp_sales_snapshots;
CREATE POLICY "auth_all_tp_sales" ON tp_sales_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
