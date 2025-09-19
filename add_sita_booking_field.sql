-- ================================================
-- 시타 예약 여부 필드 추가
-- Version: 1.0.0
-- Created: 2025-01-19
-- ================================================

-- employee_tasks 테이블에 시타 예약 여부 필드 추가
ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS sita_booking BOOLEAN DEFAULT FALSE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_employee_tasks_sita_booking ON employee_tasks(sita_booking);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_op5_sita_booking ON employee_tasks(operation_type_id, sita_booking) WHERE operation_type_id IN (SELECT id FROM operation_types WHERE code = 'OP5');

-- 기존 데이터 업데이트 (OP5의 경우 기본값 설정)
UPDATE employee_tasks 
SET sita_booking = FALSE
WHERE operation_type_id IN (
  SELECT id FROM operation_types WHERE code = 'OP5'
) AND sita_booking IS NULL;

-- 뷰 생성: 시타 예약 통계
CREATE OR REPLACE VIEW sita_booking_stats AS
SELECT 
  DATE_TRUNC('month', task_date) as month,
  operation_type_id,
  ot.code as operation_code,
  ot.name as operation_name,
  customer_type,
  consultation_channel,
  sita_booking,
  COUNT(*) as booking_count,
  COUNT(DISTINCT employee_id) as participant_count
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
WHERE ot.code = 'OP5' 
  AND task_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY 
  DATE_TRUNC('month', task_date),
  operation_type_id,
  ot.code,
  ot.name,
  customer_type,
  consultation_channel,
  sita_booking
ORDER BY month DESC, operation_code, consultation_channel, sita_booking;

-- 함수 생성: 월별 시타 예약 건수 조회
CREATE OR REPLACE FUNCTION get_monthly_sita_bookings(
  target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS TABLE (
  operation_code VARCHAR(20),
  consultation_channel VARCHAR(50),
  customer_type VARCHAR(20),
  sita_booking BOOLEAN,
  booking_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ot.code as operation_code,
    et.consultation_channel,
    et.customer_type,
    et.sita_booking,
    COUNT(*) as booking_count
  FROM employee_tasks et
  JOIN operation_types ot ON et.operation_type_id = ot.id
  WHERE ot.code = 'OP5'
    AND DATE_TRUNC('month', et.task_date) = DATE_TRUNC('month', target_month)
  GROUP BY ot.code, et.consultation_channel, et.customer_type, et.sita_booking
  ORDER BY ot.code, et.consultation_channel, et.customer_type, et.sita_booking;
END;
$$ LANGUAGE plpgsql;

-- 테스트 쿼리
SELECT '시타 예약 필드 추가 완료' as status;

-- 샘플 데이터 확인
SELECT 
  et.id,
  et.title,
  ot.code as operation_code,
  et.customer_type,
  et.consultation_channel,
  et.sita_booking,
  et.task_date
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
WHERE ot.code = 'OP5'
ORDER BY et.created_at DESC
LIMIT 10;
