-- 매장운영팀 삭제하고 박진을 마스팀으로 이동

-- 1. 박진 계정의 부서를 마스팀으로 변경
UPDATE employees 
SET department_id = (SELECT id FROM departments WHERE code = 'MAS')
WHERE employee_id = 'MASLABS-004';

-- 2. 매장운영팀 삭제 (더 이상 사용하지 않음)
DELETE FROM departments WHERE code = 'STORE';

-- 3. 확인 쿼리
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

-- 4. 현재 부서 목록 확인
SELECT name, code, description FROM departments ORDER BY name;
