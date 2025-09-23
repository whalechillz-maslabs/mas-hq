-- ========================================
-- 1단계: 필요한 컬럼들 추가
-- 실행일: 2025-01-27
-- 설명: contracts, employees, payslips 테이블에 필요한 컬럼 추가
-- ========================================

-- contracts 테이블에 필요한 컬럼 추가
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS salary_history JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS probation_period JSONB;

-- employees 테이블에 필요한 컬럼 추가
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_structure JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_anniversary_date DATE;

-- payslips 테이블에 필요한 컬럼 추가
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS meal_allowance INTEGER DEFAULT 0;

-- 완료 메시지
SELECT '1단계: 필요한 컬럼들이 성공적으로 추가되었습니다' as result;

