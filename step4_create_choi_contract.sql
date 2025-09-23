-- ========================================
-- 4단계: 최형호 계약서 생성
-- 실행일: 2025-01-27
-- 설명: 최형호의 8-9월 파트타임 계약서 생성
-- ========================================

-- 기존 최형호 계약서 삭제 (중복 방지)
DELETE FROM contracts 
WHERE employee_id = (SELECT id FROM employees WHERE name = '최형호');

-- 최형호 계약서 생성
INSERT INTO contracts (
    employee_id,
    contract_type,
    start_date,
    end_date,
    salary,
    work_hours,
    work_days,
    work_time,
    lunch_break,
    meal_allowance,
    includes_weekly_holiday,
    status,
    salary_history,
    probation_period
) VALUES (
    (SELECT id FROM employees WHERE name = '최형호'),
    'part_time',
    '2025-08-01',
    '2025-09-30',
    13000, -- 초기 시급 (8월 1일 기준)
    7,
    5,
    '09:00-17:00',
    1,
    140000, -- 식대
    true,
    'active',
    -- 급여 변동 이력
    '[
        {
            "effective_date": "2025-08-01",
            "salary": 13000,
            "reason": "초기 시급",
            "notes": "입사 시 적용된 시급"
        },
        {
            "effective_date": "2025-08-08", 
            "salary": 12000,
            "reason": "업무 숙련도 향상 필요",
            "notes": "업무 미숙으로 인한 시급 조정"
        }
    ]'::jsonb,
    -- 수습기간 설정
    '{
        "start_date": "2025-08-01",
        "end_date": "2025-08-31", 
        "minimum_wage": true
    }'::jsonb
);

-- 생성된 계약서 확인
SELECT 
    '최형호 계약서 생성 완료' as result,
    c.id,
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
WHERE e.name = '최형호';

-- 완료 메시지
SELECT '4단계: 최형호 계약서가 성공적으로 생성되었습니다' as final_result;

