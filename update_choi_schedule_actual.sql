-- ========================================
-- 최형호 8월 스케줄 데이터 실제 데이터로 업데이트
-- 실행일: 2025-01-27
-- 설명: 사용자 제공 실제 스케줄 데이터로 시스템 스케줄 업데이트
-- ========================================

-- 1. 기존 최형호 8월 스케줄 삭제
DELETE FROM schedules 
WHERE employee_id = (SELECT id FROM employees WHERE name = '최형호')
  AND schedule_date >= '2025-08-01' 
  AND schedule_date <= '2025-08-31';

-- 2. 실제 스케줄 데이터 삽입
INSERT INTO schedules (
    employee_id,
    schedule_date,
    scheduled_start,
    scheduled_end,
    total_hours,
    status,
    created_at,
    updated_at
) VALUES 
-- 8월 1일 (금) 14:30-15:30 (1시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-01',
    '14:30:00',
    '15:30:00',
    1.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 4일 (월) 13:00-17:00 (4시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-04',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 8일 (금) 13:00-16:30 (3.5시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-08',
    '13:00:00',
    '16:30:00',
    3.5,
    'completed',
    NOW(),
    NOW()
),
-- 8월 11일 (월) 13:00-17:00 (4시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-11',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 13일 (수) 10:00-12:00, 13:00-17:00 (6시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-13',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-13',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 14일 (목) 15:00-17:00 (2시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-14',
    '15:00:00',
    '17:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 18일 (월) 10:00-12:00, 13:00-17:00 (6시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-18',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-18',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 20일 (수) 10:00-12:00, 13:00-17:00 (6시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-20',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-20',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 22일 (금) 10:00-12:00, 13:00-17:00 (6시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-22',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-22',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 25일 (월) 10:00-12:00, 13:00-17:00 (6시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-25',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-25',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 26일 (화) 10:00-12:00, 13:00-18:00 (7시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-26',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-26',
    '13:00:00',
    '18:00:00',
    5.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 27일 (수) 10:00-12:00, 13:00-17:00 (6시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-27',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-27',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 28일 (목) 10:00-12:00, 13:00-17:00 (6시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-28',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-28',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
),
-- 8월 29일 (금) 10:00-12:00, 13:00-17:00 (6시간)
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-29',
    '10:00:00',
    '12:00:00',
    2.0,
    'completed',
    NOW(),
    NOW()
),
(
    (SELECT id FROM employees WHERE name = '최형호'),
    '2025-08-29',
    '13:00:00',
    '17:00:00',
    4.0,
    'completed',
    NOW(),
    NOW()
);

-- 3. 업데이트된 스케줄 확인
SELECT 
    'Updated Schedule Summary' as section,
    s.schedule_date,
    s.scheduled_start,
    s.scheduled_end,
    s.total_hours,
    s.status
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE e.name = '최형호'
  AND s.schedule_date >= '2025-08-01' 
  AND s.schedule_date <= '2025-08-31'
ORDER BY s.schedule_date, s.scheduled_start;

-- 4. 총 근무시간 계산
SELECT 
    'Total Hours Calculation' as section,
    COUNT(*) as total_schedule_entries,
    SUM(s.total_hours) as total_hours,
    COUNT(DISTINCT s.schedule_date) as working_days
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE e.name = '최형호'
  AND s.schedule_date >= '2025-08-01' 
  AND s.schedule_date <= '2025-08-31';

-- 5. 완료 메시지
SELECT '최형호 8월 스케줄이 실제 데이터로 성공적으로 업데이트되었습니다' as result;
