-- 간단한 이은정 계정 추가 (최소 필수 필드만)

-- 1. 필요한 기본 데이터 확인
SELECT 'Checking existing data...' as status;

-- 2. 이은정 계정 추가 (최소 필수 필드만)
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

-- 3. 부서/직책/역할은 나중에 업데이트
UPDATE employees 
SET 
    department_id = (SELECT id FROM departments WHERE code = 'MGMT' LIMIT 1),
    position_id = (SELECT id FROM positions WHERE name = '이사' LIMIT 1),
    role_id = (SELECT id FROM roles WHERE name = 'manager' LIMIT 1)
WHERE employee_id = 'MASLABS-002';

-- 4. 확인
SELECT 
    employee_id,
    name,
    phone,
    email,
    pin_code,
    hire_date,
    employment_type,
    status
FROM employees 
WHERE employee_id = 'MASLABS-002';
