-- ========================================
-- 날짜 기반 급여 시스템
-- 실행일: 2025-01-27
-- 설명: 현재 날짜를 기준으로 한 동적 급여 관리 시스템
-- ========================================

-- 1. 현재 날짜 기반 급여 데이터 생성 함수
CREATE OR REPLACE FUNCTION generate_current_month_salary()
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  employee_id_code TEXT,
  current_year_month TEXT,
  payment_date DATE,
  period_start DATE,
  period_end DATE,
  base_salary DECIMAL(12,2),
  overtime_pay DECIMAL(12,2),
  bonus DECIMAL(12,2),
  deductions DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  status TEXT
) AS $$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  current_year_val INTEGER := EXTRACT(YEAR FROM current_date_val);
  current_month_val INTEGER := EXTRACT(MONTH FROM current_date_val);
  payment_date_val DATE;
  period_start_val DATE;
  period_end_val DATE;
BEGIN
  -- 급여 지급일 계산 (매월 25일)
  payment_date_val := DATE(current_year_val || '-' || current_month_val || '-25');
  
  -- 이번 달 25일이 아직 안 지났으면 지난 달 25일로 설정
  IF payment_date_val > current_date_val THEN
    payment_date_val := payment_date_val - INTERVAL '1 month';
  END IF;
  
  -- 급여 기간 계산 (지난 달 1일 ~ 마지막 날)
  period_start_val := DATE(current_year_val || '-' || (current_month_val - 1) || '-01');
  period_end_val := DATE(current_year_val || '-' || current_month_val || '-01') - INTERVAL '1 day';
  
  RETURN QUERY
  SELECT 
    e.id as employee_id,
    e.name as employee_name,
    e.employee_id as employee_id_code,
    (current_year_val || '년 ' || current_month_val || '월') as current_year_month,
    payment_date_val as payment_date,
    period_start_val as period_start,
    period_end_val as period_end,
    CASE 
      WHEN e.employment_type = 'full_time' AND e.monthly_salary > 0 THEN e.monthly_salary
      WHEN e.hourly_rate > 0 THEN e.hourly_rate * 160
      ELSE 0
    END as base_salary,
    CASE 
      WHEN e.employment_type = 'full_time' AND e.monthly_salary > 0 THEN ROUND(e.monthly_salary * 0.1)
      WHEN e.hourly_rate > 0 THEN e.hourly_rate * 20
      ELSE 0
    END as overtime_pay,
    CASE 
      WHEN e.employment_type = 'full_time' AND e.monthly_salary > 0 THEN ROUND(e.monthly_salary * 0.06)
      WHEN e.hourly_rate > 0 THEN ROUND(e.hourly_rate * 160 * 0.05)
      ELSE 0
    END as bonus,
    CASE 
      WHEN e.employment_type = 'full_time' AND e.monthly_salary > 0 THEN 
        ROUND((e.monthly_salary + ROUND(e.monthly_salary * 0.1) + ROUND(e.monthly_salary * 0.06)) * 0.033)
      WHEN e.hourly_rate > 0 THEN 
        ROUND((e.hourly_rate * 160 + e.hourly_rate * 20 + ROUND(e.hourly_rate * 160 * 0.05)) * 0.033)
      ELSE 0
    END as deductions,
    CASE 
      WHEN e.employment_type = 'full_time' AND e.monthly_salary > 0 THEN 
        e.monthly_salary + ROUND(e.monthly_salary * 0.1) + ROUND(e.monthly_salary * 0.06) - 
        ROUND((e.monthly_salary + ROUND(e.monthly_salary * 0.1) + ROUND(e.monthly_salary * 0.06)) * 0.033)
      WHEN e.hourly_rate > 0 THEN 
        e.hourly_rate * 160 + e.hourly_rate * 20 + ROUND(e.hourly_rate * 160 * 0.05) - 
        ROUND((e.hourly_rate * 160 + e.hourly_rate * 20 + ROUND(e.hourly_rate * 160 * 0.05)) * 0.033)
      ELSE 0
    END as net_amount,
    'paid'::TEXT as status
  FROM employees e
  WHERE e.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 2. 현재 날짜 정보 조회 함수
CREATE OR REPLACE FUNCTION get_current_date_info()
RETURNS TABLE (
  current_date DATE,
  current_year INTEGER,
  current_month INTEGER,
  current_year_month TEXT,
  payment_date DATE,
  period_start DATE,
  period_end DATE,
  period_display TEXT
) AS $$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  current_year_val INTEGER := EXTRACT(YEAR FROM current_date_val);
  current_month_val INTEGER := EXTRACT(MONTH FROM current_date_val);
  payment_date_val DATE;
  period_start_val DATE;
  period_end_val DATE;
BEGIN
  -- 급여 지급일 계산 (매월 25일)
  payment_date_val := DATE(current_year_val || '-' || current_month_val || '-25');
  
  -- 이번 달 25일이 아직 안 지났으면 지난 달 25일로 설정
  IF payment_date_val > current_date_val THEN
    payment_date_val := payment_date_val - INTERVAL '1 month';
  END IF;
  
  -- 급여 기간 계산 (지난 달 1일 ~ 마지막 날)
  period_start_val := DATE(current_year_val || '-' || (current_month_val - 1) || '-01');
  period_end_val := DATE(current_year_val || '-' || current_month_val || '-01') - INTERVAL '1 day';
  
  RETURN QUERY
  SELECT 
    current_date_val as current_date,
    current_year_val as current_year,
    current_month_val as current_month,
    (current_year_val || '년 ' || current_month_val || '월') as current_year_month,
    payment_date_val as payment_date,
    period_start_val as period_start,
    period_end_val as period_end,
    (period_start_val || ' ~ ' || period_end_val) as period_display;
END;
$$ LANGUAGE plpgsql;

-- 3. 현재 날짜 기반 급여 데이터 삽입
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  employee_id,
  payment_date,
  period_start,
  period_end,
  base_salary,
  overtime_pay,
  bonus,
  deductions,
  net_amount,
  status
FROM generate_current_month_salary()
ON CONFLICT (employee_id, payment_date) DO UPDATE SET
  period_start = EXCLUDED.period_start,
  period_end = EXCLUDED.period_end,
  base_salary = EXCLUDED.base_salary,
  overtime_pay = EXCLUDED.overtime_pay,
  bonus = EXCLUDED.bonus,
  deductions = EXCLUDED.deductions,
  net_amount = EXCLUDED.net_amount,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 4. 현재 날짜 정보 조회
SELECT * FROM get_current_date_info();

-- 5. 현재 월 급여 현황 조회
SELECT 
  '현재 월 급여 현황' as title,
  COUNT(*) as total_employees,
  SUM(net_amount) as total_paid_amount,
  AVG(net_amount) as average_salary,
  MIN(payment_date) as payment_date,
  MIN(period_start) as period_start,
  MAX(period_end) as period_end
FROM salaries 
WHERE payment_date = (SELECT payment_date FROM get_current_date_info());

-- 6. 직원별 현재 월 급여 현황
SELECT 
  e.employee_id,
  e.name,
  e.employment_type,
  s.payment_date,
  s.period_start,
  s.period_end,
  s.base_salary,
  s.overtime_pay,
  s.bonus,
  s.deductions,
  s.net_amount,
  s.status,
  CASE 
    WHEN s.status = 'paid' THEN '✅ 지급완료'
    WHEN s.status = 'pending' THEN '⏳ 지급대기'
    ELSE '❌ 미지급'
  END as payment_status_kr
FROM employees e
JOIN salaries s ON e.id = s.employee_id
WHERE s.payment_date = (SELECT payment_date FROM get_current_date_info())
ORDER BY e.employee_id;

-- 7. 완료 메시지
SELECT '날짜 기반 급여 시스템 설정 완료!' as message,
       '현재 날짜: ' || CURRENT_DATE as current_date,
       '급여 지급일: ' || (SELECT payment_date FROM get_current_date_info()) as payment_date,
       '급여 기간: ' || (SELECT period_display FROM get_current_date_info()) as period_display;
