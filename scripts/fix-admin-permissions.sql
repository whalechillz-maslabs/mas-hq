-- ================================================
-- 관리자 계정 권한 수정 스크립트
-- Version: 2.1.3
-- Created: 2025-01-17
-- ================================================

-- 1. admin 역할 강제 생성
INSERT INTO roles (id, name, description, permissions) 
VALUES (gen_random_uuid(), 'admin', '시스템 관리자', '{"all": true}')
ON CONFLICT (name) DO NOTHING;

-- 2. manager 역할 생성
INSERT INTO roles (id, name, description, permissions) 
VALUES (gen_random_uuid(), 'manager', '매니저', '{"team_evaluation": true, "attendance_management": true}')
ON CONFLICT (name) DO NOTHING;

-- 3. team_lead 역할 생성
INSERT INTO roles (id, name, description, permissions) 
VALUES (gen_random_uuid(), 'team_lead', '팀 리더', '{"team_evaluation": true, "attendance_management": true}')
ON CONFLICT (name) DO NOTHING;

-- 4. employee 역할 생성
INSERT INTO roles (id, name, description, permissions) 
VALUES (gen_random_uuid(), 'employee', '정직원', '{"basic": true}')
ON CONFLICT (name) DO NOTHING;

-- 5. part_time 역할 생성
INSERT INTO roles (id, name, description, permissions) 
VALUES (gen_random_uuid(), 'part_time', '파트타임', '{"basic": true}')
ON CONFLICT (name) DO NOTHING;

-- 6. MGMT 부서 생성
INSERT INTO departments (id, code, name, description) 
VALUES (gen_random_uuid(), 'MGMT', '경영진', '경영진 부서')
ON CONFLICT (code) DO NOTHING;

-- 7. STORE 부서 생성
INSERT INTO departments (id, code, name, description) 
VALUES (gen_random_uuid(), 'STORE', '매장', '매장 부서')
ON CONFLICT (code) DO NOTHING;

-- 8. 대표이사 직급 생성
INSERT INTO positions (id, name, description) 
VALUES (gen_random_uuid(), '대표이사', '대표이사')
ON CONFLICT (name) DO NOTHING;

-- 9. 파트타임 직급 생성
INSERT INTO positions (id, name, description) 
VALUES (gen_random_uuid(), '파트타임', '파트타임')
ON CONFLICT (name) DO NOTHING;

-- 10. MASLABS-001 관리자 계정 강제 생성
INSERT INTO employees (
    id,
    employee_id,
    name,
    phone,
    email,
    department_id,
    position_id,
    role_id,
    hire_date,
    status,
    password_hash,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'MASLABS-001',
    '시스템 관리자',
    '010-6669-9000',
    'admin@maslabs.kr',
    d.id as department_id,
    p.id as position_id,
    r.id as role_id,
    '2025-01-01',
    'active',
    '66699000',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM departments d, positions p, roles r
WHERE d.code = 'MGMT' AND p.name = '대표이사' AND r.name = 'admin'
ON CONFLICT (employee_id) DO UPDATE SET
    role_id = (SELECT id FROM roles WHERE name = 'admin'),
    password_hash = '66699000',
    updated_at = CURRENT_TIMESTAMP;

-- 11. MASLABS-004 박진 계정 강제 생성
INSERT INTO employees (
    id,
    employee_id,
    name,
    phone,
    email,
    department_id,
    position_id,
    role_id,
    hire_date,
    status,
    hourly_rate,
    password_hash,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'MASLABS-004',
    '박진(JIN)',
    '010-9132-4337',
    'park.jin@maslabs.kr',
    d.id as department_id,
    p.id as position_id,
    r.id as role_id,
    '2025-07-29',
    'active',
    12000,
    '91324337',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM departments d, positions p, roles r
WHERE d.code = 'STORE' AND p.name = '파트타임' AND r.name = 'part_time'
ON CONFLICT (employee_id) DO UPDATE SET
    password_hash = '91324337',
    updated_at = CURRENT_TIMESTAMP;

-- 12. 현재 상태 확인
SELECT '=== 수정 후 상태 확인 ===' as info;
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
WHERE e.employee_id IN ('MASLABS-001', 'MASLABS-004')
ORDER BY e.employee_id;
