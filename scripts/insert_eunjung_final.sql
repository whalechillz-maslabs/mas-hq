-- 원격 Supabase에 이은정 매니저 계정 추가 (완전한 컬럼 목록)
-- 프로젝트: cgscbtxtgualkfalouwh

-- 1. 필요한 부서, 직책, 역할 추가 (중복 방지)
INSERT INTO departments (id, name, code, description, is_active, created_at, updated_at) 
VALUES ('cd1bf40d-6d5f-48ad-8256-9469eb8692db', '경영지원팀', 'MGMT', '경영 및 행정 지원', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO positions (id, name, level, description, created_at, updated_at) 
VALUES ('1e7e6331-3821-4e56-90d5-f9c958de99e3', '이사', 2, 'Director', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    description = EXCLUDED.description,
    updated_at = NOW();

INSERT INTO roles (id, name, description, permissions, created_at, updated_at) 
VALUES ('60989e55-424d-40cc-a812-1d142aa1899f', 'manager', '매니저/팀장', '{"tasks": true, "salaries": true, "employees": true, "schedules": true}', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- 2. 이은정 매니저 계정 추가 (모든 필수 필드 포함)
INSERT INTO employees (
    id,
    employee_id,
    email,
    name,
    phone,
    password_hash,
    department_id,
    position_id,
    role_id,
    birth_date,
    address,
    emergency_contact,
    bank_account,
    hire_date,
    resignation_date,
    employment_type,
    hourly_rate,
    monthly_salary,
    status,
    is_active,
    profile_image_url,
    bio,
    skills,
    user_meta,
    last_login,
    created_at,
    updated_at,
    nickname,
    pin_code
) VALUES (
    '7cef08a3-3222-46de-825f-5325bbf10c5a',
    'MASLABS-002',
    'lee.eunjung@maslabs.kr',
    '이은정(STE)',
    '010-3243-3099',
    '32433099',
    'cd1bf40d-6d5f-48ad-8256-9469eb8692db',
    '1e7e6331-3821-4e56-90d5-f9c958de99e3',
    '60989e55-424d-40cc-a812-1d142aa1899f',
    NULL,
    NULL,
    NULL,
    NULL,
    '2025-01-01',
    NULL,
    'full_time',
    NULL,
    NULL,
    'active',
    true,
    NULL,
    NULL,
    NULL,
    '{}',
    NOW(),
    NOW(),
    NOW(),
    '',
    '1234'
) ON CONFLICT (employee_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    password_hash = EXCLUDED.password_hash,
    department_id = EXCLUDED.department_id,
    position_id = EXCLUDED.position_id,
    role_id = EXCLUDED.role_id,
    hire_date = EXCLUDED.hire_date,
    employment_type = EXCLUDED.employment_type,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    user_meta = EXCLUDED.user_meta,
    last_login = EXCLUDED.last_login,
    updated_at = NOW(),
    nickname = EXCLUDED.nickname,
    pin_code = EXCLUDED.pin_code;

-- 3. 확인 쿼리
SELECT 
    e.employee_id,
    e.name,
    e.nickname,
    e.phone,
    d.name as department_name,
    p.name as position_name,
    r.name as role_name,
    e.pin_code,
    e.hire_date,
    e.employment_type,
    e.status
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
WHERE e.employee_id = 'MASLABS-002';
