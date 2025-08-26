-- ================================================
-- 박진 정보 수정 (마스팀 OP 팀원, 파트타임)
-- Version: 4.7.0
-- Created: 2025-08-24
-- ================================================

-- 1. 현재 박진 정보 확인
DO $$
DECLARE
    park_jin_info RECORD;
BEGIN
    SELECT 
        e.name,
        e.employee_id,
        e.employment_type,
        d.name as department_name,
        d.code as department_code,
        p.name as position_name,
        r.name as role_name
    INTO park_jin_info
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE e.name = '박진';
    
    RAISE NOTICE '=== 현재 박진 정보 ===';
    RAISE NOTICE '이름: %', park_jin_info.name;
    RAISE NOTICE '직원 ID: %', park_jin_info.employee_id;
    RAISE NOTICE '고용 형태: %', park_jin_info.employment_type;
    RAISE NOTICE '부서: % (%)', park_jin_info.department_name, park_jin_info.department_code;
    RAISE NOTICE '직급: %', park_jin_info.position_name;
    RAISE NOTICE '역할: %', park_jin_info.role_name;
END $$;

-- 2. 박진 정보 수정 (마스팀, 파트타임, OP 팀원)
UPDATE employees
SET 
    department_id = (SELECT id FROM departments WHERE code = 'MAS'),
    position_id = (SELECT id FROM positions WHERE name = '파트타임'),
    role_id = (SELECT id FROM roles WHERE name = 'employee'),
    employment_type = 'part_time',
    updated_at = NOW()
WHERE name = '박진';

-- 3. 수정 후 박진 정보 확인
DO $$
DECLARE
    updated_park_jin_info RECORD;
BEGIN
    SELECT 
        e.name,
        e.employee_id,
        e.employment_type,
        d.name as department_name,
        d.code as department_code,
        p.name as position_name,
        r.name as role_name
    INTO updated_park_jin_info
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN roles r ON e.role_id = r.id
    WHERE e.name = '박진';
    
    RAISE NOTICE '=== 수정 후 박진 정보 ===';
    RAISE NOTICE '이름: %', updated_park_jin_info.name;
    RAISE NOTICE '직원 ID: %', updated_park_jin_info.employee_id;
    RAISE NOTICE '고용 형태: %', updated_park_jin_info.employment_type;
    RAISE NOTICE '부서: % (%)', updated_park_jin_info.department_name, updated_park_jin_info.department_code;
    RAISE NOTICE '직급: %', updated_park_jin_info.position_name;
    RAISE NOTICE '역할: %', updated_park_jin_info.role_name;
    
    IF updated_park_jin_info.department_code = 'MAS' AND updated_park_jin_info.employment_type = 'part_time' THEN
        RAISE NOTICE '✅ 박진 정보가 올바르게 수정되었습니다!';
    ELSE
        RAISE NOTICE '⚠️  박진 정보 수정에 문제가 있습니다.';
    END IF;
END $$;

-- 4. 최종 직원 목록 출력
SELECT '=== 최종 직원 목록 ===' as info;
SELECT 
    e.employee_id,
    e.name as employee_name,
    e.employment_type,
    d.name as department_name,
    p.name as position_name,
    r.name as role_name,
    e.is_active
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY e.name;
