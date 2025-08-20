-- 원격 Supabase RLS 비활성화
-- 프로젝트: cgscbtxtgualkfalouwh

-- 모든 테이블의 RLS 비활성화
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'departments', 'positions', 'roles');
