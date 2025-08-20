-- 원격 Supabase에 이은정 계정 추가 (간단 버전)

-- 1. 기존 데이터 확인
SELECT '현재 employees 테이블 데이터:' as info;
SELECT employee_id, name, phone, email FROM employees ORDER BY employee_id;

-- 2. 이은정 계정 추가 (필수 필드만)
INSERT INTO employees (
    employee_id,
    name,
    phone,
    email,
    pin_code,
    hire_date,
    employment_type,
    status,
    is_active
) VALUES (
    'MASLABS-002',
    '이은정(STE)',
    '010-3243-3099',
    'lee.eunjung@maslabs.kr',
    '1234',
    '2025-01-01',
    'full_time',
    'active',
    true
) ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    pin_code = EXCLUDED.pin_code,
    hire_date = EXCLUDED.hire_date,
    employment_type = EXCLUDED.employment_type,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 3. 부서/직책/역할 연결 (기존 데이터가 있다면)
UPDATE employees 
SET 
    department_id = (SELECT id FROM departments WHERE code = 'MGMT' LIMIT 1),
    position_id = (SELECT id FROM positions WHERE name = '이사' LIMIT 1),
    role_id = (SELECT id FROM roles WHERE name = 'manager' LIMIT 1)
WHERE employee_id = 'MASLABS-002';

-- 4. 결과 확인
SELECT '이은정 계정 추가 후:' as info;
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
    e.status
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
WHERE e.employee_id = 'MASLABS-002';
