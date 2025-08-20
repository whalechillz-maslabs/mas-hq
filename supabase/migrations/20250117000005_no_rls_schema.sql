-- ================================================
-- RLS 비활성화 및 테스트용 스키마
-- Version: 2.1.4
-- Created: 2025-01-17
-- ================================================

-- 기존 RLS 정책들 삭제
DROP POLICY IF EXISTS "Employees can view own profile" ON employees;
DROP POLICY IF EXISTS "Managers can update employees" ON employees;
DROP POLICY IF EXISTS "Employees can view own salary" ON salaries;
DROP POLICY IF EXISTS "View own contracts" ON contracts;

-- 모든 테이블의 RLS 비활성화
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE salaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE operation_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE operation_type_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;

-- 관리자 계정 강제 생성/업데이트
INSERT INTO employees (
    employee_id,
    email,
    name,
    phone,
    department_id,
    position_id,
    role_id,
    hire_date,
    employment_type,
    status,
    password_hash
) VALUES (
    'MASLABS-001',
    'admin@maslabs.kr',
    '시스템 관리자',
    '010-6669-9000',
    (SELECT id FROM departments WHERE code = 'MGMT'),
    (SELECT id FROM positions WHERE name = '대표이사'),
    (SELECT id FROM roles WHERE name = 'admin'),
    '2025-01-01',
    'full_time',
    'active',
    '66699000'
) ON CONFLICT (employee_id) DO UPDATE SET
    password_hash = '66699000',
    role_id = (SELECT id FROM roles WHERE name = 'admin'),
    updated_at = CURRENT_TIMESTAMP;

-- 박진 계정 강제 생성/업데이트
INSERT INTO employees (
    employee_id,
    email,
    name,
    phone,
    department_id,
    position_id,
    role_id,
    hire_date,
    employment_type,
    status,
    hourly_rate,
    password_hash,
    nickname,
    pin_code
) VALUES (
    'MASLABS-004',
    'park.jin@maslabs.kr',
    '박진(JIN)',
    '010-9132-4337',
    (SELECT id FROM departments WHERE code = 'STORE'),
    (SELECT id FROM positions WHERE name = '파트타임'),
    (SELECT id FROM roles WHERE name = 'part_time'),
    '2025-07-29',
    'part_time',
    'active',
    12000,
    '91324337',
    'JIN',
    '1234'
) ON CONFLICT (employee_id) DO UPDATE SET
    password_hash = '91324337',
    nickname = 'JIN',
    pin_code = '1234',
    updated_at = CURRENT_TIMESTAMP;
