-- 김탁수님 스케줄 문제 진단
-- 2025년 9월 2일 기준

-- 1. 직원 테이블에서 김탁수님 정보 확인
SELECT 
    id,
    employee_id,
    name,
    email,
    created_at
FROM employees 
WHERE employee_id = 'WHA';

-- 2. 스케줄 테이블에서 오늘 데이터 확인 (간단 버전)
SELECT 
    id,
    employee_id,
    schedule_date,
    scheduled_start,
    scheduled_end,
    status
FROM schedules 
WHERE schedule_date = '2025-09-02';

-- 3. 김탁수님의 오늘 스케줄만 확인
SELECT 
    id,
    employee_id,
    schedule_date,
    scheduled_start,
    scheduled_end,
    status
FROM schedules 
WHERE schedule_date = '2025-09-02' 
AND employee_id = 'WHA';

-- 4. 이번 주 전체 스케줄 확인
SELECT 
    id,
    employee_id,
    schedule_date,
    scheduled_start,
    scheduled_end,
    status
FROM schedules 
WHERE schedule_date >= '2025-09-01' 
AND schedule_date <= '2025-09-07'
ORDER BY schedule_date, scheduled_start;

-- 5. 스케줄 테이블의 전체 레코드 수 확인
SELECT COUNT(*) as total_schedules FROM schedules;

-- 6. 오늘 날짜의 전체 스케줄 수 확인
SELECT COUNT(*) as today_schedules FROM schedules WHERE schedule_date = '2025-09-02';

-- 7. 김탁수님의 전체 스케줄 수 확인
SELECT COUNT(*) as kim_tak_su_schedules FROM schedules WHERE employee_id = 'WHA';
