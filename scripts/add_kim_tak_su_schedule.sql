-- 김탁수 오늘 스케줄 추가 (2025-09-02)
-- 1. 먼저 김탁수 직원 정보 확인
SELECT * FROM employees WHERE employee_id = 'WHA';

-- 2. 오늘 스케줄이 있는지 확인
SELECT * FROM schedules 
WHERE employee_id = 'WHA' 
AND schedule_date = '2025-09-02';

-- 3. 김탁수에게 오늘 스케줄 추가 (09:00-18:00)
INSERT INTO schedules (
    employee_id,
    schedule_date,
    scheduled_start,
    scheduled_end,
    status,
    created_at,
    updated_at
) VALUES (
    'WHA',
    '2025-09-02',
    '2025-09-02 09:00:00',
    '2025-09-02 18:00:00',
    'pending',
    NOW(),
    NOW()
);

-- 4. 추가된 스케줄 확인
SELECT 
    s.*,
    e.name as employee_name
FROM schedules s
JOIN employees e ON s.employee_id = e.employee_id
WHERE s.employee_id = 'WHA' 
AND s.schedule_date = '2025-09-02';

-- 5. 오늘 전체 스케줄 현황 확인
SELECT 
    s.schedule_date,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    e.name as employee_name
FROM schedules s
JOIN employees e ON s.employee_id = e.employee_id
WHERE s.schedule_date = '2025-09-02'
ORDER BY s.scheduled_start;
