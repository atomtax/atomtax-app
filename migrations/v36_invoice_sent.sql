-- v36: 조정료 청구서 발송 여부 컬럼 추가
--
-- 청구서 관리 화면에서 발송 상태를 추적해서 발송 누락 방지 +
-- 납부 상태와 함께 진행 관리 (PR #114).

ALTER TABLE adjustment_invoices
ADD COLUMN IF NOT EXISTS is_sent BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN adjustment_invoices.is_sent IS '청구서 발송 여부 (true = 발송 완료)';

-- 검증 쿼리
-- SELECT count(*) AS total, sum(case when is_sent then 1 else 0 end) AS sent_count
-- FROM adjustment_invoices;
