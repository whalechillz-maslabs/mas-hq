-- ========================================
-- 최형호 8월/9월 급여명세서 삭제 및 재생성
-- 실행일: 2025-01-27
-- 설명: 기존 잘못된 급여명세서 삭제 후 실제 스케줄 기반으로 재생성
-- ========================================

-- 1. 최형호 직원 ID 조회
SELECT 
    '최형호 직원 정보' as section,
    id,
    name,
    employee_id
FROM employees 
WHERE name = '최형호';

-- 2. 최형호 8월/9월 급여명세서 삭제
DELETE FROM payslips 
WHERE employee_id = (SELECT id FROM employees WHERE name = '최형호')
    AND period IN ('2025-08', '2025-09');

-- 3. 삭제 결과 확인
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
WHERE e.name = '최형호'
ORDER BY p.period;

-- 4. 완료 메시지
SELECT '최형호 8월/9월 급여명세서가 삭제되었습니다. 이제 급여명세서 생성 페이지에서 새로 생성하세요.' as result;
