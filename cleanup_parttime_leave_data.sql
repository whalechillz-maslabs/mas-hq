-- 파트타임 직원의 연차 데이터 정리 스크립트

-- 1. 최형호의 연차 신청 데이터 삭제
DELETE FROM leave_requests 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE name = '최형호' AND employment_type = 'part_time'
);

-- 2. 최형호의 연차 잔여일 데이터 삭제
DELETE FROM leave_balance 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE name = '최형호' AND employment_type = 'part_time'
);

-- 3. 모든 파트타임 직원의 연차 데이터 삭제 (일괄 정리)
DELETE FROM leave_requests 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE employment_type = 'part_time'
);

DELETE FROM leave_balance 
WHERE employee_id IN (
    SELECT id FROM employees 
    WHERE employment_type = 'part_time'
);

-- 4. 결과 확인
SELECT 
    e.name,
    e.employee_id,
    e.employment_type,
    CASE 
        WHEN lb.id IS NOT NULL THEN '연차 데이터 있음'
        ELSE '연차 데이터 없음'
    END as leave_status
FROM employees e
LEFT JOIN leave_balance lb ON e.id = lb.employee_id AND lb.year = 2025
WHERE e.status = 'active'
ORDER BY e.employment_type, e.name;
