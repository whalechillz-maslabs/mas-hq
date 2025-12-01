-- ========================================
-- 최형호의 생년월일 및 나이 확인 (국민연금 제외 여부 판단)
-- ========================================

-- 최형호의 생년월일 및 나이 확인
SELECT 
    e.id,
    e.name,
    e.employee_id,
    e.birth_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) as age,
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) >= 60 THEN '✅ 60세 이상 → 국민연금 자동 제외'
        ELSE '❌ 60세 미만 → 국민연금 포함 (계약서 설정에 따라)'
    END as pension_status,
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) >= 60 THEN '생년월일 기반 자동 제외'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.birth_date)) < 60 THEN '계약서에서 insurance_display.national_pension = false로 설정 필요'
    END as action_required
FROM employees e
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004'
ORDER BY e.created_at DESC
LIMIT 1;

