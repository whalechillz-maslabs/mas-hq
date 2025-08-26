-- ================================================
-- 이은정 직원 다시 추가
-- Version: 4.8.0
-- Created: 2025-08-24
-- ================================================

-- 1. 현재 직원 상태 확인
DO $$
DECLARE
    total_employees INTEGER;
    eunjung_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_employees FROM employees;
    SELECT COUNT(*) INTO eunjung_count FROM employees WHERE name = '이은정';
    
    RAISE NOTICE '=== 현재 직원 상태 ===';
    RAISE NOTICE '총 직원 수: %명', total_employees;
    RAISE NOTICE '이은정: %명', eunjung_count;
END $$;

-- 2. 이은정 직원 추가 (운영팀에 배정)
INSERT INTO employees (
    employee_id, name, email, phone, password_hash, 
    hire_date, department_id, position_id, role_id,
    employment_type, status, is_active, nickname, pin_code
) 
SELECT 
    'MASLABS-004',
    '이은정',
    'eunjung@maslabs.kr',
    '010-1111-2222',
    '12345678',
    '2025-08-19',
    d.id,  -- 운영팀 ID
    p.id,  -- 사원 position ID
    r.id,  -- employee role ID
    'full_time',
    'active',
    true,
    '은정',
    '1234'
FROM departments d, positions p, roles r
WHERE d.name = '운영팀' 
  AND p.name = '사원'
  AND r.name = 'employee'
ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    department_id = EXCLUDED.department_id,
    updated_at = NOW();

-- 3. 최종 상태 확인
DO $$
DECLARE
    final_total_employees INTEGER;
    final_eunjung_count INTEGER;
    final_park_jin_count INTEGER;
    final_admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_total_employees FROM employees;
    SELECT COUNT(*) INTO final_eunjung_count FROM employees WHERE name = '이은정';
    SELECT COUNT(*) INTO final_park_jin_count FROM employees WHERE name = '박진';
    SELECT COUNT(*) INTO final_admin_count FROM employees WHERE name = '시스템 관리자';
    
    RAISE NOTICE '=== 최종 직원 상태 ===';
    RAISE NOTICE '총 직원 수: %명', final_total_employees;
    RAISE NOTICE '시스템 관리자: %명', final_admin_count;
    RAISE NOTICE '이은정: %명', final_eunjung_count;
    RAISE NOTICE '박진: %명', final_park_jin_count;
    
    IF final_total_employees = 3 AND final_eunjung_count = 1 AND final_park_jin_count = 1 AND final_admin_count = 1 THEN
        RAISE NOTICE '✅ 모든 직원이 올바르게 추가되었습니다!';
    ELSE
        RAISE NOTICE '⚠️  일부 직원 정보에 문제가 있을 수 있습니다.';
    END IF;
END $$;

-- 4. 최종 직원 목록 출력
SELECT '=== 최종 직원 목록 ===' as info;
SELECT 
    e.employee_id,
    e.name as employee_name,
    e.email,
    e.phone,
    e.pin_code,
    e.employment_type,
    d.name as department_name,
    d.code as department_code,
    p.name as position_name,
    r.name as role_name,
    e.is_active
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY e.name;
