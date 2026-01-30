-- ========================================
-- 최형호 12월 급여명세서 재생성 (수정된 4대보험 요율)
-- 실행일: 2025-12-19
-- 설명: 수정된 4대보험 요율로 최형호 12월 명세서 삭제 후 재생성
-- ========================================

-- 1. 최형호 직원 ID 및 정보 확인
DO $$
DECLARE
    choi_employee_id UUID;
    choi_base_salary INTEGER := 2340000; -- 기본급
    choi_meal_allowance INTEGER := 160000; -- 식대
    choi_total_earnings INTEGER;
    choi_tax_amount INTEGER;
    
    -- 4대보험 계산 변수
    choi_health_insurance INTEGER;
    choi_long_term_care_insurance INTEGER;
    choi_employment_insurance INTEGER;
    choi_national_pension INTEGER;
    choi_total_insurance INTEGER;
    choi_net_salary INTEGER;
BEGIN
    -- 최형호 직원 ID 조회
    SELECT id INTO choi_employee_id
    FROM employees
    WHERE name = '최형호' OR employee_id = 'MASLABS-004'
    LIMIT 1;
    
    IF choi_employee_id IS NULL THEN
        RAISE EXCEPTION '최형호 직원을 찾을 수 없습니다.';
    END IF;
    
    -- 기존 12월 급여명세서 삭제
    DELETE FROM payslips
    WHERE employee_id = choi_employee_id
        AND period = '2025-12';
    
    RAISE NOTICE '최형호 12월 급여명세서 삭제 완료';
    
    -- 급여 계산
    choi_total_earnings := choi_base_salary + choi_meal_allowance; -- 2,500,000원
    
    -- 세금 계산 (3.3%)
    choi_tax_amount := ROUND(choi_base_salary * 0.033); -- 77,220원
    
    -- 4대보험 계산 (수정된 요율)
    -- 건강보험: 보수월액 × 3.545% (3원 절사)
    choi_health_insurance := FLOOR(choi_base_salary * 0.03545) - 3; -- 82,950원
    
    -- 장기요양보험: 건강보험료 × 0.9182%
    choi_long_term_care_insurance := FLOOR(choi_health_insurance * 0.009182); -- 761원
    
    -- 고용보험: 보수월액 × 0.9%
    choi_employment_insurance := FLOOR(choi_base_salary * 0.009); -- 21,060원
    
    -- 국민연금: 보수월액 × 4.5% (60세 미만 기준)
    choi_national_pension := FLOOR(choi_base_salary * 0.045); -- 105,300원
    
    -- 총 공제액
    choi_total_insurance := choi_national_pension + choi_health_insurance + 
                            choi_long_term_care_insurance + choi_employment_insurance; -- 210,071원
    
    -- 실수령액 = 총 지급액 - 4대보험 - 세금
    choi_net_salary := choi_total_earnings - choi_total_insurance - choi_tax_amount; -- 2,212,709원
    
    -- 12월 급여명세서 생성
    INSERT INTO payslips (
        employee_id,
        period,
        employment_type,
        base_salary,
        overtime_pay,
        incentive,
        point_bonus,
        meal_allowance,
        total_earnings,
        tax_amount,
        net_salary,
        status,
        -- 4대보험 정보
        national_pension,
        health_insurance,
        employment_insurance,
        industrial_accident_insurance,
        long_term_care_insurance,
        total_insurance,
        notes,
        created_at,
        updated_at
    ) VALUES (
        choi_employee_id,
        '2025-12',
        'full_time',
        choi_base_salary, -- 2,340,000
        0, -- 연장근무
        0, -- 인센티브
        0, -- 포인트 보너스
        choi_meal_allowance, -- 160,000
        choi_total_earnings, -- 2,500,000
        choi_tax_amount, -- 77,220
        choi_net_salary, -- 2,212,709
        'generated', -- 상태: 생성됨
        -- 4대보험
        choi_national_pension, -- 105,300
        choi_health_insurance, -- 82,950
        choi_employment_insurance, -- 21,060
        0, -- 산재보험 (사업주 부담)
        choi_long_term_care_insurance, -- 761
        choi_total_insurance, -- 210,071
        '수정된 4대보험 요율 적용 (2025-12-19): 장기요양보험 = 건강보험료 × 0.9182%',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '최형호 12월 급여명세서 생성 완료';
    RAISE NOTICE '기본급: %원', choi_base_salary;
    RAISE NOTICE '식대: %원', choi_meal_allowance;
    RAISE NOTICE '총 지급액: %원', choi_total_earnings;
    RAISE NOTICE '건강보험: %원', choi_health_insurance;
    RAISE NOTICE '장기요양보험: %원', choi_long_term_care_insurance;
    RAISE NOTICE '고용보험: %원', choi_employment_insurance;
    RAISE NOTICE '국민연금: %원', choi_national_pension;
    RAISE NOTICE '총 공제액: %원', choi_total_insurance;
    RAISE NOTICE '세금 (3.3%%): %원', choi_tax_amount;
    RAISE NOTICE '실수령액: %원', choi_net_salary;
    
END $$;

-- 2. 생성 결과 확인
SELECT 
    '생성된 급여명세서 확인' as section,
    e.name as 직원명,
    e.employee_id as 직원번호,
    p.period as 급여기간,
    p.base_salary as 기본급,
    p.meal_allowance as 식대,
    p.total_earnings as 총지급액,
    p.health_insurance as 건강보험,
    p.long_term_care_insurance as 장기요양보험,
    p.employment_insurance as 고용보험,
    p.national_pension as 국민연금,
    p.total_insurance as 총공제액,
    p.tax_amount as 세금,
    p.net_salary as 실수령액,
    p.status as 상태,
    p.notes as 비고
FROM payslips p
JOIN employees e ON p.employee_id = e.id
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004'
    AND p.period = '2025-12'
ORDER BY p.period DESC;
