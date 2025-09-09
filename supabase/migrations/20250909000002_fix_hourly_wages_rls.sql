-- hourly_wages 테이블 RLS 정책 수정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "hourly_wages_read_policy" ON public.hourly_wages;
DROP POLICY IF EXISTS "hourly_wages_write_policy" ON public.hourly_wages;

-- 새로운 정책 생성 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "hourly_wages_all_policy" ON public.hourly_wages
  FOR ALL USING (true) WITH CHECK (true);
