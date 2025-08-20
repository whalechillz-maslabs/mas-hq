-- 원격 Supabase에 이은정 매니저 계정 추가/업데이트
-- 프로젝트: cgscbtxtgualkfalouwh

-- 1. 필요한 부서, 직책, 역할이 있는지 확인하고 없으면 추가
INSERT INTO departments (id, name, code, description, is_active, created_at, updated_at) 
VALUES ('cd1bf40d-6d5f-48ad-8256-9469eb8692db', '경영지원팀', 'MGMT', '경영 및 행정 지원', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO positions (id, name, level, description, created_at, updated_at) 
VALUES ('1e7e6331-3821-4e56-90d5-f9c958de99e3', '이사', 2, 'Director', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, description, permissions, created_at, updated_at) 
VALUES ('60989e55-424d-40cc-a812-1d142aa1899f', 'manager', '매니저/팀장', '{"tasks": true, "salaries": true, "employees": true, "schedules": true}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. 이은정 매니저 계정 추가/업데이트
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
) VALUES (
    '7cef08a3-3222-46de-825f-5325bbf10c5a',
    'MASLABS-002',
    '이은정(STE)',
    '',
    '010-3243-3099',
    'lee.eunjung@maslabs.kr',
    'cd1bf40d-6d5f-48ad-8256-9469eb8692db',
    '1e7e6331-3821-4e56-90d5-f9c958de99e3',
    '60989e55-424d-40cc-a812-1d142aa1899f',
    '1234',
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
    updated_at = NOW();

-- 3. 확인 쿼리
SELECT 
    e.employee_id,
    e.name,
    e.nickname,
    e.phone,
    d.name as department_name,
    p.name as position_name,
    r.name as role_name,
    e.pin_code
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
WHERE e.employee_id = 'MASLABS-002';
