-- ================================================
-- 부서 구조 업데이트 (운영팀 코드 OP->HQ)
-- Version: 4.5.0
-- Created: 2025-08-24
-- ================================================

-- 1. 현재 상태 확인
DO $$
DECLARE
    current_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count FROM departments;
    RAISE NOTICE '=== 현재 departments 상태 ===';
    RAISE NOTICE '총 부서 수: %개', current_count;
END $$;

-- 2. 기존 부서명을 새로운 구조로 변경
UPDATE departments 
SET name = '운영팀', 
    code = 'HQ', 
    description = '본사 운영 관리',
    updated_at = NOW()
WHERE name = '경영지원팀';

UPDATE departments 
SET name = '싱싱팀', 
    code = 'SING', 
    description = '싱싱 관련 업무',
    updated_at = NOW()
WHERE name = '매장운영팀';

UPDATE departments 
SET name = '마스팀', 
    code = 'MAS', 
    description = '마스 관련 업무',
    updated_at = NOW()
WHERE name = '본사';

-- 3. 이은정 직원 추가 (운영팀에 배정)
INSERT INTO employees (
    employee_id, name, email, phone, password_hash, 
    hire_date, department_id, position_id, role_id,
    employment_type, status, is_active, nickname, pin_code
) 
SELECT 
    'MASLABS-004',
    '이은정',
    'eunjung@maslabs.kr',
    '010-1234-5678',
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

-- 4. 최종 상태 확인
DO $$
DECLARE
    final_count INTEGER;
    op_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM departments;
    SELECT COUNT(*) INTO op_count FROM departments WHERE code IN ('HQ', 'SING', 'MAS');
    
    RAISE NOTICE '=== 업데이트 완료 ===';
    RAISE NOTICE '총 부서 수: %개', final_count;
    RAISE NOTICE '핵심 부서 수: %개', op_count;
    
    IF op_count >= 3 THEN
        RAISE NOTICE '✅ 운영팀(HQ), 싱싱팀(SING), 마스팀(MAS) 구조 완성!';
    ELSE
        RAISE NOTICE '⚠️  핵심 부서가 %개만 있습니다.', op_count;
    END IF;
END $$;

-- 5. 최종 부서 및 직원 목록 출력
SELECT '=== 최종 부서 구조 ===' as info;
SELECT id, name, code, description FROM departments ORDER BY name;

SELECT '=== 최종 직원 목록 ===' as info;
SELECT 
    e.employee_id,
    e.name as employee_name,
    d.name as department_name,
    p.name as position_name,
    r.name as role_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY d.name, e.name;
