-- 원격 Supabase employees 테이블 구조 확인
\d employees;

-- 현재 employees 테이블의 컬럼 목록 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;
