-- ========================================
-- 최형호 급여명세서 새로운 계산 방식으로 업데이트
-- 실행일: 2025-01-27
-- 설명: 시급별 상세 내역을 반영한 정확한 급여 계산
-- ========================================

-- 1. 최형호 직원 ID 조회
SELECT 
    '최형호 직원 정보' as section,
    id,
    name,
    employee_id
FROM employees 
WHERE name = '최형호';

-- 2. 최형호 8월 급여명세서 업데이트
-- 8월 1일~7일: 13,000원 × 35시간 = 455,000원
-- 8월 8일~31일: 12,000원 × 105시간 = 1,260,000원
-- 총 근무시간: 140시간
-- 총 시급 급여: 1,715,000원
-- 식대: 140,000원
-- 총 지급액: 1,855,000원
-- 세금 (3.3%): 61,215원
-- 실수령액: 1,793,785원

UPDATE payslips 
SET 
    base_salary = 1715000,  -- 시급 급여
    meal_allowance = 140000,  -- 식대
    total_earnings = 1855000,  -- 총 지급액
    tax_amount = 61215,  -- 세금 (3.3%)
    net_salary = 1793785,  -- 실수령액
    total_hours = 140.0,  -- 총 근무시간
    hourly_rate = 13000,  -- 기본 시급 (표시용)
    daily_details = '[
        {
            "date": "2025-08-01",
            "hours": 7,
            "hourly_rate": 13000,
            "daily_wage": 91000
        },
        {
            "date": "2025-08-04", 
            "hours": 7,
            "hourly_rate": 13000,
            "daily_wage": 91000
        },
        {
            "date": "2025-08-05",
            "hours": 7,
            "hourly_rate": 13000,
            "daily_wage": 91000
        },
        {
            "date": "2025-08-06",
            "hours": 7,
            "hourly_rate": 13000,
            "daily_wage": 91000
        },
        {
            "date": "2025-08-07",
            "hours": 7,
            "hourly_rate": 13000,
            "daily_wage": 91000
        },
        {
            "date": "2025-08-08",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-11",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-12",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-13",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-14",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-18",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-19",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-20",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-21",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-22",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-25",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-26",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-27",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-28",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-08-29",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        }
    ]'::jsonb,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM employees WHERE name = '최형호')
    AND period = '2025-08';

-- 3. 최형호 9월 급여명세서 업데이트
-- 9월 1일~30일: 12,000원 × 154시간 = 1,848,000원
-- 총 근무시간: 154시간
-- 총 시급 급여: 1,848,000원
-- 식대: 140,000원
-- 총 지급액: 1,988,000원
-- 세금 (3.3%): 65,604원
-- 실수령액: 1,922,396원

UPDATE payslips 
SET 
    base_salary = 1848000,  -- 시급 급여
    meal_allowance = 140000,  -- 식대
    total_earnings = 1988000,  -- 총 지급액
    tax_amount = 65604,  -- 세금 (3.3%)
    net_salary = 1922396,  -- 실수령액
    total_hours = 154.0,  -- 총 근무시간
    hourly_rate = 12000,  -- 시급
    daily_details = '[
        {
            "date": "2025-09-01",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-02",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-03",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-04",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-05",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-08",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-09",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-10",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-11",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-12",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-15",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-16",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-17",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-18",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-19",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-22",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-23",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-24",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-25",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-26",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-29",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        },
        {
            "date": "2025-09-30",
            "hours": 7,
            "hourly_rate": 12000,
            "daily_wage": 84000
        }
    ]'::jsonb,
    updated_at = NOW()
WHERE employee_id = (SELECT id FROM employees WHERE name = '최형호')
    AND period = '2025-09';

-- 4. 업데이트 결과 확인
SELECT 
    '업데이트 결과' as section,
    e.name as employee_name,
    p.period,
    p.base_salary,
    p.meal_allowance,
    p.total_earnings,
    p.tax_amount,
    p.net_salary,
    p.total_hours,
    p.hourly_rate,
    p.status,
    p.updated_at
FROM payslips p
JOIN employees e ON p.employee_id = e.id
WHERE e.name = '최형호'
ORDER BY p.period;

-- 5. 완료 메시지
SELECT '최형호 급여명세서가 새로운 계산 방식으로 업데이트되었습니다' as result;
