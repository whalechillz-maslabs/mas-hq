-- 원격 Supabase 테이블 구조 확인

-- 1. employees 테이블 컬럼 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. departments 테이블 확인
SELECT id, name, code FROM departments ORDER BY name;

-- 3. positions 테이블 확인  
SELECT id, name, level FROM positions ORDER BY level;

-- 4. roles 테이블 확인
SELECT id, name, description FROM roles ORDER BY name;

-- 5. 현재 employees 데이터 확인
SELECT 
    employee_id,
    name,
    phone,
    email,
    department_id,
    position_id,
    role_id,
    pin_code
FROM employees 
ORDER BY employee_id;
