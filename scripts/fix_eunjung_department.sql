-- 이은정 부서를 경영지원팀으로 수정

-- 1. 이은정 계정의 부서를 경영지원팀으로 변경
UPDATE employees 
SET department_id = (SELECT id FROM departments WHERE code = 'MGMT')
WHERE employee_id = 'MASLABS-002';

-- 2. 확인 쿼리
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
