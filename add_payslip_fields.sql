-- 급여 명세서 테이블에 새로운 필드 추가
ALTER TABLE payslips 
ADD COLUMN IF NOT EXISTS fuel_allowance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_work INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_holiday_pay INTEGER DEFAULT 0;

-- 기존 데이터 마이그레이션 (나수진의 경우)
UPDATE payslips 
SET 
  fuel_allowance = incentive,
  additional_work = overtime_pay,
  weekly_holiday_pay = 0,
  incentive = 0,
  overtime_pay = 0
WHERE employee_id IN (
  SELECT id FROM employees WHERE name = '나수진'
);

-- 필드 설명 추가
COMMENT ON COLUMN payslips.fuel_allowance IS '주유대 (연료비)';
COMMENT ON COLUMN payslips.additional_work IS '추가 근무 수당';
COMMENT ON COLUMN payslips.weekly_holiday_pay IS '주휴수당';
COMMENT ON COLUMN payslips.overtime_pay IS '시간외 근무 수당 (기존 주휴수당 필드)';
COMMENT ON COLUMN payslips.incentive IS '인센티브/성과급';
