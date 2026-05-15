-- v29: clients 테이블에 임시 고객 플래그 추가
-- is_temporary = true인 고객은 정식 고객 목록에 표시되지 않음
-- 단, 종합소득세 보고서 등에서는 보고서 작성용으로 사용 가능

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN clients.is_temporary IS
  '일회성 고객 여부. true이면 정식 고객 목록에서 숨김. 보고서 작성용.';

-- 인덱스 — 정식 고객 목록 쿼리 성능 (is_temporary = false 필터)
CREATE INDEX IF NOT EXISTS idx_clients_is_temporary
  ON clients(is_temporary)
  WHERE is_temporary = false;

-- 검증 쿼리
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'clients' AND column_name = 'is_temporary';
--
-- SELECT COUNT(*) AS total,
--        SUM(CASE WHEN is_temporary = false THEN 1 ELSE 0 END) AS regular,
--        SUM(CASE WHEN is_temporary = true THEN 1 ELSE 0 END) AS temp
-- FROM clients;
