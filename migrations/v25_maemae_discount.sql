-- ====================================================
-- v25: 조정료 청구서 — 매매업 할인 + 수동 행 담당자
-- ====================================================
-- 매매업 고객(업종코드 703011/703012) 결산보수+세무조정료 × 30% 자동 할인.
-- 수동 수정 가능. 최종 공급가액 30만원 미만 시 자동 축소.
-- 수동 추가 행은 client_id 없으므로 manager 직접 입력 가능.

ALTER TABLE adjustment_invoices
  ADD COLUMN IF NOT EXISTS maemae_discount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_maemae_discount_manual BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manager TEXT;

COMMENT ON COLUMN adjustment_invoices.maemae_discount IS
  '매매업 할인 (매매업 고객 결산보수+세무조정료 × 30%, 자동/수동)';
COMMENT ON COLUMN adjustment_invoices.is_maemae_discount_manual IS
  'true 면 자동 계산 무시하고 maemae_discount 값 그대로 사용';
COMMENT ON COLUMN adjustment_invoices.manager IS
  '수동 추가 행의 담당자명 (client_id null 일 때). client_id 있으면 clients.manager 사용';

-- 검증
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'adjustment_invoices'
  AND column_name IN ('maemae_discount', 'is_maemae_discount_manual', 'manager')
ORDER BY ordinal_position;
