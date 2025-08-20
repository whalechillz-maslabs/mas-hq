-- ================================================
-- 관리자 및 박진 계정 삽입
-- Version: 2.1.1
-- Created: 2025-01-17
-- ================================================

-- 1. 관리자 계정 생성 또는 패스워드 업데이트
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
    password_hash = '66699000',
    updated_at = CURRENT_TIMESTAMP;

-- 2. 박진 계정 생성 또는 패스워드 업데이트
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
