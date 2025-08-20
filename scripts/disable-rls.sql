-- ================================================
-- 모든 RLS 비활성화 스크립트
-- 테스트 시 권한 문제 해결용
-- ================================================

-- 1. employees 테이블 RLS 비활성화
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- 2. roles 테이블 RLS 비활성화
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- 3. departments 테이블 RLS 비활성화
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- 4. positions 테이블 RLS 비활성화
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;

-- 5. schedules 테이블 RLS 비활성화
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;

-- 6. employee_tasks 테이블 RLS 비활성화
ALTER TABLE employee_tasks DISABLE ROW LEVEL SECURITY;

-- 7. salaries 테이블 RLS 비활성화
ALTER TABLE salaries DISABLE ROW LEVEL SECURITY;

-- 8. contracts 테이블 RLS 비활성화
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;

-- 9. documents 테이블 RLS 비활성화
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- 10. performance_metrics 테이블 RLS 비활성화
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;

-- 11. notifications 테이블 RLS 비활성화
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 12. audit_logs 테이블 RLS 비활성화
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 13. sessions 테이블 RLS 비활성화
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- 14. team_members 테이블 RLS 비활성화
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- 15. operation_types 테이블 RLS 비활성화
ALTER TABLE operation_types DISABLE ROW LEVEL SECURITY;

-- 16. operation_type_permissions 테이블 RLS 비활성화
ALTER TABLE operation_type_permissions DISABLE ROW LEVEL SECURITY;

-- 17. RLS 비활성화 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
