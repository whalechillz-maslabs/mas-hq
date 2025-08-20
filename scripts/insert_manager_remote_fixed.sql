-- 원격 Supabase에 이은정 매니저 계정 추가 (password 컬럼 제거)
-- 프로젝트: cgscbtxtgualkfalouwh

-- 1. manager 역할이 있는지 확인하고 없으면 추가 (UUID 사용)
INSERT INTO roles (id, name, description) 
VALUES (
    gen_random_uuid(),
    'manager', 
    '매니저 - 팀 관리 및 직원 관리 권한'
)
ON CONFLICT (name) DO NOTHING;

-- 2. manager 역할의 ID 가져오기
WITH manager_role AS (
    SELECT id FROM roles WHERE name = 'manager'
)
-- 3. 이은정 매니저 계정 추가 (password 컬럼 제거)
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
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'MASLABS-002',
    '이은정',
    'STE',
    '010-3243-3099',
    'ste@maslabs.kr',
    'mgmt',
    'director',
    manager_role.id,
    '1234',
    NOW(),
    NOW()
FROM manager_role
ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    nickname = EXCLUDED.nickname,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id,
    position_id = EXCLUDED.position_id,
    role_id = EXCLUDED.role_id,
    pin_code = EXCLUDED.pin_code,
    updated_at = NOW();

-- 4. 기존 계정들의 PIN 번호를 1234로 통일
UPDATE employees 
SET pin_code = '1234' 
WHERE employee_id IN ('MASLABS-001', 'MASLABS-004');

-- 5. 확인 쿼리
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
