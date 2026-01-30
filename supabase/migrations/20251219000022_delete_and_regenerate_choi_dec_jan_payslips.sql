-- ========================================
-- 최형호 12월 급여명세서 삭제 및 12월/1월 재생성
-- 실행일: 2025-12-19
-- 설명: 수정된 4대보험 요율로 최형호 12월 명세서 삭제 후 재생성, 1월 명세서 생성
-- ========================================

-- 1. 최형호 직원 ID 조회
SELECT 
    '최형호 직원 정보' as section,
    id,
    name,
    employee_id,
    monthly_salary,
    employment_type
FROM employees 
WHERE name = '최형호' OR employee_id = 'MASLABS-004';

-- 2. 최형호 12월 급여명세서 삭제
DELETE FROM payslips 
WHERE employee_id IN (SELECT id FROM employees WHERE name = '최형호' OR employee_id = 'MASLABS-004')
    AND period = '2025-12';

-- 3. 최형호 1월 급여명세서 삭제 (이미 있다면)
DELETE FROM payslips 
WHERE employee_id IN (SELECT id FROM employees WHERE name = '최형호' OR employee_id = 'MASLABS-004')
    AND period = '2026-01';

-- 4. 삭제 결과 확인
SELECT 
    '삭제 후 남은 급여명세서' as section,
    e.name as employee_name,
    p.period,
    p.base_salary,
    p.total_earnings,
    p.net_salary,
    p.status
FROM payslips p
JOIN employees e ON p.employee_id = e.id
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004'
ORDER BY p.period DESC;

-- 5. 완료 메시지
SELECT 
    '최형호 12월/1월 급여명세서 삭제 완료' as result,
    '이제 급여명세서 생성 페이지에서 수정된 4대보험 요율로 새로 생성하세요.' as next_step;
