-- 현재 직원 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- 부서 정보 확인
SELECT * FROM departments;

-- 직원별 부서 정보 확인
SELECT e.name, e.employee_id, d.name as department_name, r.name as role_name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN roles r ON e.role_id = r.id
WHERE e.status = 'active'
ORDER BY d.name, e.name;
