-- ================================================
-- 직원 데이터 정리 (이은정 중복 제거, 박진 추가, 핀번호 통일)
-- Version: 4.6.0
-- Created: 2025-08-24
-- ================================================

-- 1. 현재 상태 확인
DO $$
DECLARE
    eunjung_count INTEGER;
    park_jin_count INTEGER;
    pin_1234_count INTEGER;
    total_employees INTEGER;
BEGIN
    SELECT COUNT(*) INTO eunjung_count FROM employees WHERE name = '이은정';
    SELECT COUNT(*) INTO park_jin_count FROM employees WHERE name = '박진';
    SELECT COUNT(*) INTO pin_1234_count FROM employees WHERE pin_code = '1234';
    SELECT COUNT(*) INTO total_employees FROM employees;
    
    RAISE NOTICE '=== 현재 직원 상태 ===';
    RAISE NOTICE '총 직원 수: %명', total_employees;
    RAISE NOTICE '이은정: %명', eunjung_count;
    RAISE NOTICE '박진: %명', park_jin_count;
    RAISE NOTICE '핀번호 1234: %명', pin_1234_count;
END $$;

-- 2. team_members 테이블 정리 (이은정 중복 제거 전)
DELETE FROM team_members 
WHERE team_member_id IN (
    SELECT id
    FROM employees
    WHERE name = '이은정'
    ORDER BY created_at ASC
    LIMIT 1
);

-- 3. 이은정 중복 제거 (가장 최근에 생성된 것만 남기고 삭제)
DELETE FROM employees
WHERE id IN (
    SELECT id
    FROM employees
    WHERE name = '이은정'
    ORDER BY created_at ASC
    LIMIT 1
);

-- 3. 박진 직원 추가 (운영팀에 배정)
INSERT INTO employees (
    employee_id, name, email, phone, password_hash, 
    hire_date, department_id, position_id, role_id,
    employment_type, status, is_active, nickname, pin_code
) 
SELECT 
    'MASLABS-005',
    '박진',
    'park.jin@maslabs.kr',
    '010-1234-5678',
    '12345678',
    '2025-08-20',
    d.id,  -- 마스팀 ID
    p.id,  -- 파트타임 position ID
    r.id,  -- employee role ID
    'part_time',
    'active',
    true,
    '박진',
    '1234'
FROM departments d, positions p, roles r
WHERE d.name = '마스팀' 
  AND p.name = '파트타임'
  AND r.name = 'employee'
ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    department_id = EXCLUDED.department_id,
    updated_at = NOW();

-- 4. 모든 직원의 핀번호를 1234로 통일
UPDATE employees
SET pin_code = '1234',
    updated_at = NOW()
WHERE pin_code != '1234';

-- 5. 최종 상태 확인
DO $$
DECLARE
    final_eunjung_count INTEGER;
    final_park_jin_count INTEGER;
    final_pin_1234_count INTEGER;
    final_total_employees INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_eunjung_count FROM employees WHERE name = '이은정';
    SELECT COUNT(*) INTO final_park_jin_count FROM employees WHERE name = '박진';
    SELECT COUNT(*) INTO final_pin_1234_count FROM employees WHERE pin_code = '1234';
    SELECT COUNT(*) INTO final_total_employees FROM employees;
    
    RAISE NOTICE '=== 수정 완료 ===';
    RAISE NOTICE '총 직원 수: %명', final_total_employees;
    RAISE NOTICE '이은정: %명', final_eunjung_count;
    RAISE NOTICE '박진: %명', final_park_jin_count;
    RAISE NOTICE '핀번호 1234: %명', final_pin_1234_count;
    
    IF final_eunjung_count = 1 AND final_park_jin_count = 1 AND final_pin_1234_count = final_total_employees THEN
        RAISE NOTICE '✅ 모든 문제가 해결되었습니다!';
    ELSE
        RAISE NOTICE '⚠️  일부 문제가 남아있습니다.';
    END IF;
END $$;

-- 6. 최종 직원 목록 출력
SELECT '=== 최종 직원 목록 ===' as info;
SELECT 
    e.employee_id,
    e.name as employee_name,
    e.email,
    e.phone,
    e.pin_code,
    d.name as department_name,
    p.name as position_name,
    r.name as role_name,
    e.is_active
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY e.name;
