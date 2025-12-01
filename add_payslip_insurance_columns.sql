-- ========================================
-- payslips 테이블에 4대보험 관련 컬럼 추가
-- 실행일: 2025-12-01
-- 설명: 급여명세서에 4대보험 정보를 저장하기 위한 컬럼 추가
-- ========================================

-- 1. 4대보험 관련 컬럼 추가
ALTER TABLE payslips 
ADD COLUMN IF NOT EXISTS national_pension INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS health_insurance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS employment_insurance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS industrial_accident_insurance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS long_term_care_insurance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_insurance INTEGER DEFAULT 0;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN payslips.national_pension IS '국민연금';
COMMENT ON COLUMN payslips.health_insurance IS '건강보험';
COMMENT ON COLUMN payslips.employment_insurance IS '고용보험';
COMMENT ON COLUMN payslips.industrial_accident_insurance IS '산재보험';
COMMENT ON COLUMN payslips.long_term_care_insurance IS '장기요양보험';
COMMENT ON COLUMN payslips.total_insurance IS '4대보험 총액';

-- 3. 컬럼 추가 확인
SELECT 
    '4대보험 컬럼 추가 완료' as result,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payslips' 
    AND column_name IN (
        'national_pension',
        'health_insurance',
        'employment_insurance',
        'industrial_accident_insurance',
        'long_term_care_insurance',
        'total_insurance'
    )
ORDER BY column_name;


