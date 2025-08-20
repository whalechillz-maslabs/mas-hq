-- 원격 Supabase 설정 확인

-- 1. RLS 상태 확인
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'departments', 'positions', 'roles')
ORDER BY tablename;

-- 2. 부서 데이터 확인
SELECT '=== 부서 데이터 ===' as info;
SELECT id, name, code, description FROM departments ORDER BY name;

-- 3. 직책 데이터 확인
SELECT '=== 직책 데이터 ===' as info;
SELECT id, name, level, description FROM positions ORDER BY level;

-- 4. 역할 데이터 확인
SELECT '=== 역할 데이터 ===' as info;
SELECT id, name, description FROM roles ORDER BY name;

-- 5. 직원 데이터 확인
SELECT '=== 직원 데이터 ===' as info;
SELECT 
    employee_id,
    name,
    phone,
    email,
    department_id,
    position_id,
    role_id,
    pin_code,
    hire_date,
    employment_type,
    status
FROM employees 
ORDER BY employee_id;

-- 6. 이은정 계정 상세 확인
SELECT '=== 이은정 계정 상세 ===' as info;
SELECT 
    e.employee_id,
    e.name,
    e.phone,
    e.email,
    d.name as department,
    p.name as position,
    r.name as role,
    e.pin_code,
    e.hire_date,
    e.employment_type,
    e.status,
    e.is_active
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
WHERE e.employee_id = 'MASLABS-002';
