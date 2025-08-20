-- ================================================
-- 박진(JIN) 데이터 확인
-- ================================================

-- 1. 박진 직원 데이터 확인
SELECT 
    '박진 직원 데이터 확인' as check_type,
    e.id,
    e.employee_id,
    e.name,
    e.phone,
    e.email,
    e.password_hash,
    e.pin_code,
    e.hourly_rate,
    e.status,
    e.created_at
FROM employees e 
WHERE e.employee_id = 'MASLABS-004' OR e.phone = '010-9132-4337';

-- 2. 전체 직원 목록 확인
SELECT 
    '전체 직원 목록' as check_type,
    e.employee_id,
    e.name,
    e.phone,
    e.department_id,
    e.role_id,
    e.status
FROM employees e 
ORDER BY e.created_at DESC
LIMIT 10;

-- 3. 부서 데이터 확인
SELECT 
    '부서 데이터' as check_type,
    d.id,
    d.name,
    d.code
FROM departments d;

-- 4. 역할 데이터 확인
SELECT 
    '역할 데이터' as check_type,
    r.id,
    r.name,
    r.description
FROM roles r;

-- 5. 직급 데이터 확인
SELECT 
    '직급 데이터' as check_type,
    p.id,
    p.name,
    p.level
FROM positions p;
