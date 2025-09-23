-- ========================================
-- 2단계: 기존 뷰 정리
-- 실행일: 2025-01-27
-- 설명: 중복된 뷰들 삭제
-- ========================================

-- 기존 중복 뷰들 정리
DROP VIEW IF EXISTS contracts_with_employees CASCADE;
DROP VIEW IF EXISTS employee_details CASCADE;
DROP VIEW IF EXISTS monthly_attendance_summary CASCADE;

-- 완료 메시지
SELECT '2단계: 기존 뷰들이 성공적으로 정리되었습니다' as result;

