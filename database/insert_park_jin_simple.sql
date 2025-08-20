-- ================================================
-- 박진(JIN) 계정 간단 삽입
-- ================================================

-- 1. 박진 직원 정보 삽입
INSERT INTO employees (
    id,
    employee_id,
    name,
    phone,
    email,
    department,
    position,
    role_id,
    hire_date,
    status,
    hourly_rate,
    bank_account,
    bank_name,
    password_hash,
    pin_code,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'MASLABS-004',
    '박진(JIN)',
    '010-9132-4337',
    'park.jin@maslabs.kr',
    'OP팀',
    '파트타임',
    'part_time',
    '2025-07-29',
    'active',
    12000,
    '19007131399',
    '우리은행',
    '91324337', -- 기본 패스워드: 전화번호 8자리
    '1234', -- 기본 핀번호
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    role_id = EXCLUDED.role_id,
    hire_date = EXCLUDED.hire_date,
    status = EXCLUDED.status,
    hourly_rate = EXCLUDED.hourly_rate,
    bank_account = EXCLUDED.bank_account,
    bank_name = EXCLUDED.bank_name,
    password_hash = EXCLUDED.password_hash,
    pin_code = EXCLUDED.pin_code,
    updated_at = CURRENT_TIMESTAMP;

-- 확인용 쿼리
SELECT '박진(JIN) 데이터 삽입 완료' as status;
SELECT 
    e.name,
    e.employee_id,
    e.department,
    e.position,
    e.hourly_rate,
    e.bank_account,
    e.bank_name,
    e.password_hash,
    e.pin_code
FROM employees e 
WHERE e.employee_id = 'MASLABS-004';
