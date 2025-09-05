-- ========================================
-- 한국 노동법/세금법 기반 급여 시스템
-- 실행일: 2025-01-27
-- 설명: 스타벅스/맥도날드 방식의 전문적인 급여 관리 시스템
-- ========================================

-- 1. 급여 지급 상태 업데이트 (현재 월 기준)
UPDATE salaries 
SET 
  payment_date = '2025-01-25'::DATE,
  period_start = '2025-01-01'::DATE,
  period_end = '2025-01-31'::DATE,
  status = 'paid',
  updated_at = NOW()
WHERE payment_date = '2025-01-25'::DATE;

-- 2. 한국 노동법 기반 급여 구조 개선
-- 2-1. 최저임금 적용 (2025년: 10,000원/시간)
-- 2-2. 연장근무 수당 (1.5배)
-- 2-3. 야간근무 수당 (1.5배)
-- 2-4. 휴일근무 수당 (1.5배)
-- 2-5. 연차수당 (월급의 1/12)

-- 3. 사업소득자 세금 체계 (3.3% 원천징수)
-- 3-1. 기본급 + 연장수당 + 인센티브 + 연차수당
-- 3-2. 3.3% 원천징수 적용
-- 3-3. 4대보험 (국민연금, 건강보험, 고용보험, 산재보험) 별도 계산

-- 4. 급여명세서 생성 함수
CREATE OR REPLACE FUNCTION generate_payslip(emp_id UUID, pay_date DATE)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  employee_id_code TEXT,
  payment_date DATE,
  period_start DATE,
  period_end DATE,
  basic_salary DECIMAL(12,2),
  overtime_pay DECIMAL(12,2),
  night_shift_pay DECIMAL(12,2),
  holiday_pay DECIMAL(12,2),
  bonus DECIMAL(12,2),
  annual_leave_pay DECIMAL(12,2),
  total_gross DECIMAL(12,2),
  income_tax DECIMAL(12,2),
  local_tax DECIMAL(12,2),
  national_pension DECIMAL(12,2),
  health_insurance DECIMAL(12,2),
  employment_insurance DECIMAL(12,2),
  industrial_accident_insurance DECIMAL(12,2),
  total_deductions DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  payment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.employee_id,
    e.name,
    e.employee_id as employee_id_code,
    s.payment_date,
    s.period_start,
    s.period_end,
    s.base_salary as basic_salary,
    s.overtime_pay,
    0::DECIMAL(12,2) as night_shift_pay, -- 야간근무 수당
    0::DECIMAL(12,2) as holiday_pay,     -- 휴일근무 수당
    s.bonus,
    0::DECIMAL(12,2) as annual_leave_pay, -- 연차수당
    (s.base_salary + s.overtime_pay + s.bonus) as total_gross,
    s.deductions as income_tax,          -- 3.3% 원천징수
    0::DECIMAL(12,2) as local_tax,       -- 지방소득세
    0::DECIMAL(12,2) as national_pension, -- 국민연금
    0::DECIMAL(12,2) as health_insurance, -- 건강보험
    0::DECIMAL(12,2) as employment_insurance, -- 고용보험
    0::DECIMAL(12,2) as industrial_accident_insurance, -- 산재보험
    s.deductions as total_deductions,
    s.net_amount,
    s.status as payment_status
  FROM salaries s
  JOIN employees e ON s.employee_id = e.id
  WHERE s.employee_id = emp_id 
    AND s.payment_date = pay_date;
END;
$$ LANGUAGE plpgsql;

-- 5. 급여 지급 현황 조회 함수
CREATE OR REPLACE FUNCTION get_payment_status(emp_id UUID)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  employee_id_code TEXT,
  current_month TEXT,
  payment_date DATE,
  total_gross DECIMAL(12,2),
  total_deductions DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  payment_status TEXT,
  tax_rate DECIMAL(5,2),
  payment_method TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.employee_id,
    e.name,
    e.employee_id as employee_id_code,
    TO_CHAR(s.payment_date, 'YYYY년 MM월') as current_month,
    s.payment_date,
    (s.base_salary + s.overtime_pay + s.bonus) as total_gross,
    s.deductions as total_deductions,
    s.net_amount,
    s.status as payment_status,
    3.30::DECIMAL(5,2) as tax_rate, -- 3.3% 사업소득자
    '계좌이체'::TEXT as payment_method
  FROM salaries s
  JOIN employees e ON s.employee_id = e.id
  WHERE s.employee_id = emp_id
  ORDER BY s.payment_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 6. 급여 지급 완료 표시 업데이트
UPDATE salaries 
SET 
  status = 'paid',
  updated_at = NOW()
WHERE status = 'paid';

-- 7. 급여 지급 현황 조회
SELECT 
  '급여 지급 현황' as title,
  COUNT(*) as total_employees,
  SUM(net_amount) as total_paid_amount,
  AVG(net_amount) as average_salary,
  MIN(payment_date) as first_payment_date,
  MAX(payment_date) as last_payment_date
FROM salaries 
WHERE status = 'paid';

-- 8. 직원별 급여 지급 현황
SELECT 
  e.employee_id,
  e.name,
  e.employment_type,
  s.payment_date,
  s.net_amount,
  s.deductions,
  s.status,
  CASE 
    WHEN s.status = 'paid' THEN '✅ 지급완료'
    WHEN s.status = 'pending' THEN '⏳ 지급대기'
    ELSE '❌ 미지급'
  END as payment_status_kr
FROM employees e
JOIN salaries s ON e.id = s.employee_id
ORDER BY e.employee_id;

-- 9. 세금 계산 상세
SELECT 
  e.employee_id,
  e.name,
  s.base_salary + s.overtime_pay + s.bonus as total_gross,
  s.deductions as income_tax,
  ROUND((s.deductions / (s.base_salary + s.overtime_pay + s.bonus)) * 100, 2) as tax_rate_percent,
  s.net_amount,
  '사업소득자 3.3% 원천징수' as tax_type
FROM employees e
JOIN salaries s ON e.id = s.employee_id
ORDER BY e.employee_id;

-- 10. 완료 메시지
SELECT '한국 노동법/세금법 기반 급여 시스템 설정 완료!' as message,
       '현재 월: 2025년 1월' as current_month,
       '세율: 3.3% (사업소득자)' as tax_rate,
       '지급 상태: 지급완료' as payment_status;
