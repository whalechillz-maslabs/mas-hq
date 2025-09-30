-- 급여 명세서 테이블에 새로운 필드 추가
ALTER TABLE payslips 
ADD COLUMN IF NOT EXISTS fuel_allowance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_work INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_holiday_pay INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS transportation_allowance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS performance_bonus INTEGER DEFAULT 0;

-- 필드 설명 추가
COMMENT ON COLUMN payslips.fuel_allowance IS '주유대 (연료비)';
COMMENT ON COLUMN payslips.additional_work IS '추가 근무 수당';
COMMENT ON COLUMN payslips.weekly_holiday_pay IS '주휴수당';
COMMENT ON COLUMN payslips.transportation_allowance IS '교통비';
COMMENT ON COLUMN payslips.performance_bonus IS '성과급/보너스';

-- 기존 필드 설명 업데이트
COMMENT ON COLUMN payslips.overtime_pay IS '시간외 근무 수당 (기존 주휴수당 필드)';
COMMENT ON COLUMN payslips.incentive IS '인센티브/성과급 (기존)';
COMMENT ON COLUMN payslips.meal_allowance IS '식대/식비';
COMMENT ON COLUMN payslips.point_bonus IS '포인트 보너스';
