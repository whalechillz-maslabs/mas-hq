-- ========================================
-- 최형호 2026년 연차 used_days 수정
-- 실행일: 2025-12-19
-- 설명: 최형호의 2026년 연차 used_days를 3일로 설정 (2025년에 3일 사용했으므로)
-- ========================================

-- 1. 최형호 2026년 연차 used_days를 3일로 설정
UPDATE leave_balance
SET 
  used_days = 3,
  updated_at = CURRENT_TIMESTAMP
WHERE employee_id IN (SELECT id FROM employees WHERE name = '최형호' OR employee_id = 'MASLABS-004')
  AND year = 2026;

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

