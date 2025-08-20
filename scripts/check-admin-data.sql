-- ================================================
-- 관리자 계정 및 역할 상태 확인
-- ================================================

-- 1. 모든 역할 확인
SELECT '=== 모든 역할 ===' as info;
SELECT id, name, description, permissions FROM roles ORDER BY name;

-- 2. 모든 부서 확인
SELECT '=== 모든 부서 ===' as info;
SELECT id, code, name, description FROM departments ORDER BY code;

-- 3. 모든 직급 확인
SELECT '=== 모든 직급 ===' as info;
SELECT id, name, description FROM positions ORDER BY name;

-- 4. 관리자 계정 확인
SELECT '=== 관리자 계정 ===' as info;
SELECT 
    e.employee_id,
    e.name,
    e.phone,
    e.role_id,
    r.name as role_name,
    e.department_id,
    d.code as dept_code,
    e.position_id,
    p.name as position_name,
    e.status
FROM employees e
LEFT JOIN roles r ON e.role_id = r.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
WHERE e.employee_id = 'MASLABS-001';

-- 5. 박진 계정 확인
SELECT '=== 박진 계정 ===' as info;
SELECT 
    e.employee_id,
    e.name,
    e.phone,
    e.role_id,
    r.name as role_name,
    e.department_id,
    d.code as dept_code,
    e.position_id,
    p.name as position_name,
    e.status
FROM employees e
LEFT JOIN roles r ON e.role_id = r.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
WHERE e.employee_id = 'MASLABS-004';

-- 6. 모든 직원 확인
SELECT '=== 모든 직원 ===' as info;
SELECT 
    e.employee_id,
    e.name,
    e.phone,
    r.name as role_name,
    d.code as dept_code,
    p.name as position_name,
    e.status
FROM employees e
LEFT JOIN roles r ON e.role_id = r.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
ORDER BY e.employee_id;
