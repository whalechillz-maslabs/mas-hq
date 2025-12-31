-- ========================================
-- 최형호 2026년 연차 생성 (11일 기준)
-- 실행일: 2025-12-19
-- 설명: 최형호의 2026년 연차 잔여일 생성 (1년차: 11일)
-- ========================================

-- 1. 최형호 2026년 연차 생성 (11일 기준)
INSERT INTO leave_balance (employee_id, year, total_days, used_days, leave_anniversary_date)
SELECT 
    id,
    2026,
    11, -- 1년차: 11일 (회사 정책)
    0, -- 사용 연차 0일
    '2025-10-01' -- 연차 기산일
FROM employees 
WHERE (name = '최형호' OR employee_id = 'MASLABS-004')
ON CONFLICT (employee_id, year) 
DO UPDATE SET 
    total_days = 11,
    leave_anniversary_date = '2025-10-01',
    updated_at = CURRENT_TIMESTAMP;

-- 2. 최종 확인
SELECT 
    '최형호 2026년 연차 확인' as section,
    e.name as 직원명,
    e.employee_id as 직원번호,
    lb.year as 연도,
    lb.total_days as 총연차,
    lb.used_days as 사용연차,
    lb.remaining_days as 잔여연차,
    lb.leave_anniversary_date as 연차기산일
FROM employees e
JOIN leave_balance lb ON e.id = lb.employee_id AND lb.year = 2026
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004';

