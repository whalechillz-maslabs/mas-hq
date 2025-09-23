-- ========================================
-- 급여명세서 식대 포함 테스트 스크립트
-- 실행일: 2025-01-27
-- 설명: 최형호의 8월 급여명세서 생성 및 식대 포함 확인
-- ========================================

-- 1. 최형호 8월 스케줄 데이터 확인
SELECT 
    '최형호 8월 스케줄' as section,
    schedule_date,
    total_hours,
    status,
    notes
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE e.name = '최형호'
    AND s.schedule_date >= '2025-08-01'
    AND s.schedule_date <= '2025-08-31'
ORDER BY s.schedule_date;

-- 2. 최형호 계약서 정보 확인
SELECT 
    '최형호 계약서 정보' as section,
    c.contract_type,
    c.start_date,
    c.end_date,
    c.salary,
    c.meal_allowance,
    c.salary_history,
    c.probation_period,
    c.status
FROM contracts c
JOIN employees e ON c.employee_id = e.id
WHERE e.name = '최형호'
    AND c.status = 'active';

-- 3. 최형호 시급 정보 확인
SELECT 
    '최형호 시급 정보' as section,
    hw.base_wage,
    hw.effective_start_date,
    hw.effective_end_date,
    hw.status
FROM hourly_wages hw
JOIN employees e ON hw.employee_id = e.id
WHERE e.name = '최형호'
    AND hw.status = 'active'
ORDER BY hw.effective_start_date;

-- 4. 급여명세서 생성 테스트 (8월)
-- 실제 급여 계산 로직 시뮬레이션
WITH choi_august_schedule AS (
    SELECT 
        s.schedule_date,
        s.total_hours,
        s.status,
        -- 해당 날짜의 시급 계산
        CASE 
            WHEN s.schedule_date <= '2025-08-04' THEN 13000
            WHEN s.schedule_date >= '2025-08-08' THEN 12000
            ELSE 13000
        END as hourly_rate
    FROM schedules s
    JOIN employees e ON s.employee_id = e.id
    WHERE e.name = '최형호'
        AND s.schedule_date >= '2025-08-01'
        AND s.schedule_date <= '2025-08-31'
        AND s.status = 'completed'
),
choi_wage_calculation AS (
    SELECT 
        SUM(total_hours * hourly_rate) as total_wage,
        SUM(total_hours) as total_hours,
        COUNT(*) as worked_days
    FROM choi_august_schedule
)
SELECT 
    '최형호 8월 급여 계산' as section,
    total_hours,
    worked_days,
    total_wage,
    140000 as meal_allowance,
    total_wage + 140000 as total_earnings,
    ROUND(total_wage * 0.033) as tax_amount,
    total_wage + 140000 - ROUND(total_wage * 0.033) as net_salary
FROM choi_wage_calculation;

-- 5. 완료 메시지
SELECT '급여명세서 식대 포함 테스트 완료' as result;
