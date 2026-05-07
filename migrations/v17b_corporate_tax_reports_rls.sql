-- v17b: corporate_tax_reports RLS 정책 추가
-- 내부 직원용 시스템이므로 인증된 사용자는 전체 접근 허용.
-- Supabase SQL 에디터에서 실행.

ALTER TABLE corporate_tax_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_full_access" ON corporate_tax_reports;

CREATE POLICY "authenticated_full_access"
  ON corporate_tax_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
