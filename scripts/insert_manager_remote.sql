-- 원격 Supabase에 이은정 매니저 계정 추가
-- 프로젝트: cgscbtxtgualkfalouwh

-- 1. manager 역할이 있는지 확인하고 없으면 추가
INSERT INTO roles (id, name, description) 
VALUES ('manager', 'manager', '매니저 - 팀 관리 및 직원 관리 권한')
ON CONFLICT (id) DO NOTHING;

-- 2. 이은정 매니저 계정 추가
INSERT INTO employees (
    id,
    employee_id,
    name,
    nickname,
    phone,
    email,
    department_id,
    position_id,
    role_id,
    pin_code,
    password,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'MASLABS-002',
    '이은정',
    'STE',
    '010-3243-3099',
    'ste@maslabs.kr',
    'mgmt',
    'director',
    'manager',
    '1234',
    '32433099',
    NOW(),
    NOW()
) ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    nickname = EXCLUDED.nickname,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id,
    position_id = EXCLUDED.position_id,
    role_id = EXCLUDED.role_id,
    pin_code = EXCLUDED.pin_code,
    password = EXCLUDED.password,
    updated_at = NOW();

-- 3. 기존 계정들의 PIN 번호를 1234로 통일
UPDATE employees 
SET pin_code = '1234' 
WHERE employee_id IN ('MASLABS-001', 'MASLABS-004');

-- 4. 확인 쿼리
SELECT 
    e.employee_id,
    e.name,
    e.nickname,
    e.phone,
    e.role_id,
    r.name as role_name,
    e.pin_code
FROM employees e
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY e.employee_id;
