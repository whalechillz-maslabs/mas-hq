-- ========================================
-- 이미 승인된 연차 신청에 대한 연차 차감 처리
-- 실행일: 2025-12-19
-- 설명: 이미 승인된 상태이지만 연차가 차감되지 않은 신청에 대해 연차 차감 처리
-- ========================================

-- 1. 현재 상태 확인 (승인되었지만 연차가 차감되지 않은 신청)
SELECT 
    '승인되었지만 연차 미차감 신청 확인' as section,
    lr.id,
    e.name,
    e.employee_id,
    lr.start_date,
    lr.end_date,
    lr.leave_type,
    lr.status,
    lr.leave_days,
    lb.total_days as 총연차,
    lb.used_days as 사용연차,
    lb.remaining_days as 잔여연차
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
LEFT JOIN leave_balance lb ON lr.employee_id = lb.employee_id 
  AND lb.year = EXTRACT(YEAR FROM lr.start_date)
WHERE lr.status = 'approved'
  AND (lr.leave_type != 'special' OR lr.is_special_leave = false)
  AND lr.leave_days IS NOT NULL
ORDER BY lr.created_at DESC;

-- 2. 이미 승인된 연차 신청에 대해 연차 차감 처리
-- (특별연차 제외, 월차/병가/기타/연차 모두 차감)
-- 주의: 이 쿼리는 복잡하므로 최형호만 먼저 처리

-- 3. 최형호 특별 처리 (12월 22-24일 연차 차감)
UPDATE leave_balance
SET 
  used_days = 3,
  updated_at = CURRENT_TIMESTAMP
WHERE employee_id IN (SELECT id FROM employees WHERE name = '최형호' OR employee_id = 'MASLABS-004')
  AND year = 2025
  AND used_days < 3;

-- 4. 최종 확인
SELECT 
    '최종 확인' as section,
    e.name as 직원명,
    e.employee_id as 직원번호,
    lb.year as 연도,
    lb.total_days as 총연차,
    lb.used_days as 사용연차,
    lb.remaining_days as 잔여연차,
    (SELECT COUNT(*) FROM leave_requests 
     WHERE employee_id = e.id 
     AND status = 'approved'
     AND (leave_type != 'special' OR is_special_leave = false)
     AND EXTRACT(YEAR FROM start_date) = lb.year) as 승인된신청건수
FROM employees e
JOIN leave_balance lb ON e.id = lb.employee_id AND lb.year = 2025
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004';

