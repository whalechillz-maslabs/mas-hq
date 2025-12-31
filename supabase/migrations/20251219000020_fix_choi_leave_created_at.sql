-- ========================================
-- 최형호 연차 신청일 수정 (2025-12-01 09:00 KST)
-- 실행일: 2025-12-19
-- 설명: 최형호의 연차 신청일을 2025-12-01 09:00:00 KST로 변경
-- ========================================

-- 최형호의 연차 신청일을 2025-12-01 09:00:00 KST로 변경
-- KST는 UTC+9이므로 UTC로는 2025-12-01 00:00:00
UPDATE leave_requests
SET 
  created_at = '2025-12-01 00:00:00+09'::timestamptz,
  updated_at = CURRENT_TIMESTAMP
WHERE employee_id IN (
  SELECT id FROM employees 
  WHERE name = '최형호' OR employee_id = 'MASLABS-004'
)
AND start_date = '2025-12-22'
AND end_date = '2025-12-24';

-- 확인
SELECT 
  e.name,
  e.employee_id,
  lr.created_at as 신청일_UTC,
  lr.created_at AT TIME ZONE 'Asia/Seoul' as 신청일_KST,
  lr.start_date as 시작일,
  lr.end_date as 종료일,
  lr.status
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004'
ORDER BY lr.created_at DESC;

