-- ========================================
-- 최형호의 생년월일 및 계약서 보험 설정 확인
-- 실행일: 2025-12-01
-- ========================================

-- 1. 최형호의 생년월일 및 나이 확인
SELECT 
    '직원 정보' as section,
    e.id,
    e.name,
    e.employee_id,
    e.birth_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) as age,
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) >= 60 THEN '60세 이상 (국민연금 제외)'
        ELSE '60세 미만 (국민연금 포함)'
    END as pension_status
FROM employees e
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004'
ORDER BY e.created_at DESC
LIMIT 1;

-- 2. 최형호의 활성 계약서 보험 설정 확인
SELECT 
    '계약서 보험 설정' as section,
    c.id,
    c.contract_type,
    c.start_date,
    c.end_date,
    c.insurance_4major,
    c.insurance_display,
    c.insurance_display->>'national_pension' as national_pension_setting,
    c.insurance_display->>'health' as health_setting,
    c.insurance_display->>'employment' as employment_setting,
    c.insurance_display->>'industrial_accident' as industrial_accident_setting,
    c.status
FROM contracts c
INNER JOIN employees e ON c.employee_id = e.id
WHERE (e.name = '최형호' OR e.employee_id = 'MASLABS-004')
    AND c.status = 'active'
    AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
ORDER BY c.start_date DESC
LIMIT 1;

-- 3. 최형호의 최근 명세서 확인 (11월)
SELECT 
    '최근 명세서' as section,
    p.id,
    p.period,
    p.base_salary,
    p.meal_allowance,
    p.total_earnings,
    p.national_pension,
    p.health_insurance,
    p.employment_insurance,
    p.industrial_accident_insurance,
    p.long_term_care_insurance,
    p.total_insurance,
    p.tax_amount,
    p.net_salary,
    p.status,
    p.created_at
FROM payslips p
INNER JOIN employees e ON p.employee_id = e.id
WHERE (e.name = '최형호' OR e.employee_id = 'MASLABS-004')
    AND p.period LIKE '2025-11%'
ORDER BY p.created_at DESC
LIMIT 1;

