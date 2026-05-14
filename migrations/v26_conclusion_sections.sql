-- ====================================================
-- v26: 종합소득세 보고서 결론 섹션 구조 추가
-- ====================================================
-- 기존 conclusion_notes(TEXT) 는 유지 (legacy 호환).
-- conclusion_sections(JSONB) 에 섹션 배열 저장 — 헤더 수정/표시 토글/사용자 추가 섹션 지원.
-- 각 섹션: {id, header, body, order, is_visible, is_user_defined, section_key?}

ALTER TABLE income_tax_reports
  ADD COLUMN IF NOT EXISTS conclusion_sections JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN income_tax_reports.conclusion_sections IS
  '결론/의견 섹션 배열 (v26). 각 섹션: id/header/body/order/is_visible/is_user_defined/section_key';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'income_tax_reports'
  AND column_name = 'conclusion_sections';
