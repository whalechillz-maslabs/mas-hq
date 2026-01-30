-- ========================================
-- 최형호 12월 급여명세서 재생성 (수정된 4대보험 요율)
-- 실행일: 2025-12-19
-- 설명: 수정된 4대보험 요율로 최형호 12월 명세서 삭제 후 재생성
-- ========================================

-- 1. 최형호 직원 ID 및 정보 확인
SELECT 
    '최형호 직원 정보' as section,
    id,
    name,
    employee_id,
    monthly_salary,
    employment_type
FROM employees 
WHERE name = '최형호' OR employee_id = 'MASLABS-004';

-- 2. 기존 12월 급여명세서 삭제
DELETE FROM payslips 
WHERE employee_id IN (SELECT id FROM employees WHERE name = '최형호' OR employee_id = 'MASLABS-004')
    AND period = '2025-12';

-- 3. 최형호 12월 급여명세서 재생성 (수정된 4대보험 요율)
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
)
SELECT 
    e.id as employee_id,
    '2025-12' as period,
    'full_time' as employment_type,
    2340000 as base_salary, -- 기본급
    0 as overtime_pay, -- 연장근무
    0 as incentive, -- 인센티브
    0 as point_bonus, -- 포인트 보너스
    160000 as meal_allowance, -- 식대
    2500000 as total_earnings, -- 총 지급액 (2,340,000 + 160,000)
    77220 as tax_amount, -- 세금 (3.3%): 2,340,000 × 0.033 = 77,220
    -- 실수령액 계산: 총 지급액 - 4대보험 - 세금
    (2500000 - 210071 - 77220) as net_salary, -- 2,212,709원
    'generated' as status, -- 상태: 생성됨
    -- 4대보험 계산 (수정된 요율)
    105300 as national_pension, -- 국민연금: 2,340,000 × 0.045 = 105,300
    82950 as health_insurance, -- 건강보험: FLOOR(2,340,000 × 0.03545) - 3 = 82,950
    21060 as employment_insurance, -- 고용보험: FLOOR(2,340,000 × 0.009) = 21,060
    0 as industrial_accident_insurance, -- 산재보험 (사업주 부담)
    761 as long_term_care_insurance, -- 장기요양보험: FLOOR(82,950 × 0.009182) = 761
    210071 as total_insurance, -- 총 공제액: 105,300 + 82,950 + 21,060 + 761 = 210,071
    '수정된 4대보험 요율 적용 (2025-12-19): 장기요양보험 = 건강보험료 × 0.9182%' as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM employees e
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004'
LIMIT 1;

-- 4. 생성 결과 확인
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
WHERE (e.name = '최형호' OR e.employee_id = 'MASLABS-004')
    AND p.period = '2025-12'
ORDER BY p.period DESC;
