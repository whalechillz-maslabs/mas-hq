-- STE 부서 삭제하고 마스팀, 싱싱팀 추가 (UUID 수정)

-- 1. 기존 departments 데이터 삭제 (외래키 제약조건 고려)
DELETE FROM public.employees WHERE department_id IN (
    SELECT id FROM departments WHERE code = 'STE'
);
DELETE FROM public.departments WHERE code = 'STE';

-- 2. 새로운 departments 데이터 삽입 (올바른 UUID 형식)
INSERT INTO departments (id, name, code, description, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), '마스팀', 'MAS', '마스팀 운영', true, NOW(), NOW()),
(gen_random_uuid(), '싱싱팀', 'SING', '싱싱팀 운영', true, NOW(), NOW());

-- 3. 이은정 계정의 부서를 마스팀으로 변경
UPDATE employees 
SET department_id = (SELECT id FROM departments WHERE code = 'MAS')
WHERE employee_id = 'MASLABS-002';

-- 4. 확인 쿼리
SELECT 
    e.employee_id,
    e.name,
    e.nickname,
    e.phone,
    d.name as department_name,
    p.name as position_name,
    r.name as role_name,
    e.pin_code
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY e.employee_id;
