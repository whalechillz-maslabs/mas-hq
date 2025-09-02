-- 김탁수의 스케줄 데이터 확인
-- 1. 직원 정보 확인
SELECT 
    id,
    employee_id,
    name,
    email
FROM employees 
WHERE name LIKE '%김탁수%' OR employee_id = 'WHA';

-- 2. 오늘(9월 2일) 스케줄 확인
SELECT 
    s.id,
    s.employee_id,
    s.schedule_date,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    e.name as employee_name,
    e.employee_id as emp_code
FROM schedules s
JOIN employees e ON s.employee_id = e.employee_id
WHERE s.schedule_date = '2025-09-02'
ORDER BY s.scheduled_start;

-- 3. 김탁수의 모든 스케줄 확인
SELECT 
    s.id,
    s.employee_id,
    s.schedule_date,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    e.name as employee_name
FROM schedules s
JOIN employees e ON s.employee_id = e.employee_id
WHERE e.employee_id = 'WHA'
ORDER BY s.schedule_date DESC, s.scheduled_start;

-- 4. 최근 7일간 스케줄 현황
SELECT 
    s.schedule_date,
    COUNT(*) as schedule_count,
    STRING_AGG(e.name, ', ') as employees
FROM schedules s
JOIN employees e ON s.employee_id = e.employee_id
WHERE s.schedule_date >= '2025-08-26'
GROUP BY s.schedule_date
ORDER BY s.schedule_date DESC;

-- 5. schedules 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'schedules'
ORDER BY ordinal_position;
