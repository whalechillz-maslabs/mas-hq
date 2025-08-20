-- ================================================
-- 박진(JIN) 계정만 삽입
-- ================================================

-- 1. 박진 직원 정보 삽입 (기존 데이터와 충돌하지 않도록)
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
    bank_account,
    password_hash,
    pin_code,
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
    '{"bank_name": "우리은행", "account_number": "19007131399", "account_holder": "박진(JIN)"}',
    '91324337', -- 기본 패스워드: 전화번호 8자리
    '1234', -- 기본 핀번호
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM departments d, positions p, roles r
WHERE d.code = 'OP' AND p.name = '파트타임' AND r.name = 'part_time'
ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id,
    position_id = EXCLUDED.position_id,
    role_id = EXCLUDED.role_id,
    hire_date = EXCLUDED.hire_date,
    status = EXCLUDED.status,
    hourly_rate = EXCLUDED.hourly_rate,
    bank_account = EXCLUDED.bank_account,
    password_hash = EXCLUDED.password_hash,
    pin_code = EXCLUDED.pin_code,
    updated_at = CURRENT_TIMESTAMP;

-- 확인용 쿼리
SELECT '박진(JIN) 데이터 삽입 완료' as status;
SELECT 
    e.name,
    e.employee_id,
    e.phone,
    e.email,
    d.name as department,
    p.name as position,
    r.name as role,
    e.hourly_rate,
    e.password_hash,
    e.pin_code
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
WHERE e.employee_id = 'MASLABS-004';
