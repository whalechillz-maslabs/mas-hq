-- ========================================
-- contracts 테이블에 insurance_4major 컬럼 추가
-- 실행일: 2025-01-27
-- 설명: 4대보험 가입 여부를 저장하는 컬럼 추가
-- ========================================

-- 1. insurance_4major 컬럼 추가
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS insurance_4major BOOLEAN DEFAULT true;

-- 2. 기존 데이터에 기본값 설정 (파트타임은 false, 정규직/연봉제는 true)
UPDATE contracts 
SET insurance_4major = CASE 
    WHEN contract_type = 'part_time' THEN false
    WHEN contract_type IN ('full_time', 'annual') THEN true
    ELSE true
END
WHERE insurance_4major IS NULL;

-- 3. 컬럼 추가 확인
SELECT 
    'insurance_4major 컬럼 추가 완료' as result,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
    AND column_name = 'insurance_4major';

-- 4. 기존 계약서 데이터 확인
SELECT 
    '기존 계약서 데이터 확인' as section,
    id,
    employee_id,
    contract_type,
    insurance_4major,
    meal_allowance
FROM contracts
ORDER BY created_at DESC;
