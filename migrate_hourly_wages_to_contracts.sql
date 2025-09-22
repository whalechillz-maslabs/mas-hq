-- hourly_wages 데이터를 contracts 테이블로 마이그레이션
-- 실행 전 백업 필수!

-- 1. 기존 hourly_wages 데이터 확인
SELECT 
  hw.id as hourly_wage_id,
  e.name as employee_name,
  e.id as employee_id,
  hw.base_wage,
  hw.effective_start_date,
  hw.effective_end_date,
  hw.status
FROM hourly_wages hw
JOIN employees e ON hw.employee_id = e.id
WHERE hw.status = 'active'
ORDER BY e.name, hw.effective_start_date;

-- 2. contracts 테이블에 hourly_wages 데이터 마이그레이션
-- (기존 contracts 데이터와 중복되지 않도록 주의)

-- 최형호의 기존 hourly_wages 데이터를 contracts로 이관
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
)
SELECT 
  hw.employee_id,
  'part_time' as contract_type,
  hw.effective_start_date as start_date,
  hw.effective_end_date as end_date,
  hw.base_wage as salary,
  7 as work_hours,
  5 as work_days,
  '09:00-17:00' as work_time,
  1 as lunch_break,
  140000 as meal_allowance, -- 최형호 식대
  true as includes_weekly_holiday,
  'active' as status,
  -- 급여 변동 이력 (최형호의 경우)
  CASE 
    WHEN e.name = '최형호' THEN 
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
      ]'::jsonb
    ELSE NULL
  END as salary_history,
  -- 수습기간 설정 (최형호의 경우)
  CASE 
    WHEN e.name = '최형호' THEN 
      '{
        "start_date": "2025-08-01",
        "end_date": "2025-08-31", 
        "minimum_wage": true
      }'::jsonb
    ELSE NULL
  END as probation_period
FROM hourly_wages hw
JOIN employees e ON hw.employee_id = e.id
WHERE hw.status = 'active'
  AND e.name = '최형호'
  AND NOT EXISTS (
    -- 이미 contracts에 데이터가 있는지 확인
    SELECT 1 FROM contracts c 
    WHERE c.employee_id = hw.employee_id 
    AND c.start_date = hw.effective_start_date
  );

-- 3. 마이그레이션 결과 확인
SELECT 
  e.name as employee_name,
  c.contract_type,
  c.start_date,
  c.end_date,
  c.salary,
  c.meal_allowance,
  c.salary_history,
  c.probation_period
FROM contracts c
JOIN employees e ON c.employee_id = e.id
WHERE e.name = '최형호'
ORDER BY c.start_date;

-- 4. 마이그레이션 완료 후 hourly_wages 테이블 비활성화 (선택사항)
-- UPDATE hourly_wages SET status = 'migrated' WHERE status = 'active';

-- 5. 완료 메시지
SELECT 'Hourly wages data migrated to contracts table successfully' as result;
