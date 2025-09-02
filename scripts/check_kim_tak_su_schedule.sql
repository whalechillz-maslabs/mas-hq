-- 김탁수님의 오늘 스케줄 확인
-- 2025년 9월 2일 기준

-- 1. 직원 정보 확인
SELECT 
    id,
    employee_id,
    name,
    email,
    created_at
FROM employees 
WHERE name LIKE '%김탁수%' OR employee_id = 'WHA';

-- 2. 오늘 스케줄 확인 (2025-09-02)
SELECT 
    s.id,
    s.employee_id,
    s.schedule_date,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    e.name as employee_name,
    e.employee_id as employee_code
FROM schedules s
JOIN employees e ON s.employee_id = e.employee_id
WHERE s.schedule_date = '2025-09-02'
AND (e.name LIKE '%김탁수%' OR e.employee_id = 'WHA');

-- 3. 최근 스케줄 확인 (이번 주)
SELECT 
    s.id,
    s.employee_id,
    s.schedule_date,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    e.name as employee_name,
    e.employee_id as employee_code
FROM schedules s
JOIN employees e ON s.employee_id = e.employee_id
WHERE s.schedule_date >= '2025-08-26'
AND s.schedule_date <= '2025-09-02'
AND (e.name LIKE '%김탁수%' OR e.employee_id = 'WHA')
ORDER BY s.schedule_date DESC, s.scheduled_start;

-- 4. 스케줄 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'schedules'
ORDER BY ordinal_position;

-- 5. 직원 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees'
ORDER BY ordinal_position;
