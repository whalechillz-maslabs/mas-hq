-- ================================================
-- 신규 상담 구분을 위한 필드 추가
-- Version: 1.0.0
-- Created: 2025-01-17
-- ================================================

-- employee_tasks 테이블에 신규 상담 구분 필드 추가
ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'existing' CHECK (customer_type IN ('new', 'existing')),
ADD COLUMN IF NOT EXISTS consultation_channel VARCHAR(50) DEFAULT 'phone' CHECK (consultation_channel IN ('phone', 'kakao', 'smartstore', 'official_website'));

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_employee_tasks_customer_type ON employee_tasks(customer_type);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_consultation_channel ON employee_tasks(consultation_channel);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_op5_new_customer ON employee_tasks(operation_type_id, customer_type) WHERE customer_type = 'new';

-- 기존 데이터 업데이트 (OP5, OP12의 경우 기본값 설정)
UPDATE employee_tasks 
SET customer_type = 'existing', consultation_channel = 'phone'
WHERE operation_type_id IN (
  SELECT id FROM operation_types WHERE code IN ('OP5', 'OP12')
) AND customer_type IS NULL;

-- 뷰 생성: 신규 상담 통계
CREATE OR REPLACE VIEW new_consultation_stats AS
SELECT 
  DATE_TRUNC('month', task_date) as month,
  operation_type_id,
  ot.code as operation_code,
  ot.name as operation_name,
  customer_type,
  consultation_channel,
  COUNT(*) as consultation_count,
  COUNT(DISTINCT employee_id) as participant_count
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
WHERE ot.code IN ('OP5', 'OP12') 
  AND customer_type = 'new'
  AND task_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY 
  DATE_TRUNC('month', task_date),
  operation_type_id,
  ot.code,
  ot.name,
  customer_type,
  consultation_channel
ORDER BY month DESC, operation_code, consultation_channel;

-- 함수 생성: 월별 신규 상담 건수 조회
CREATE OR REPLACE FUNCTION get_monthly_new_consultations(
  target_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS TABLE (
  operation_code VARCHAR(20),
  consultation_channel VARCHAR(50),
  consultation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ot.code as operation_code,
    et.consultation_channel,
    COUNT(*) as consultation_count
  FROM employee_tasks et
  JOIN operation_types ot ON et.operation_type_id = ot.id
  WHERE ot.code IN ('OP5', 'OP12')
    AND et.customer_type = 'new'
    AND DATE_TRUNC('month', et.task_date) = DATE_TRUNC('month', target_month)
  GROUP BY ot.code, et.consultation_channel
  ORDER BY ot.code, et.consultation_channel;
END;
$$ LANGUAGE plpgsql;

-- 테스트 쿼리
SELECT '신규 상담 필드 추가 완료' as status;

-- 샘플 데이터 확인
SELECT 
  et.id,
  et.title,
  ot.code as operation_code,
  et.customer_type,
  et.consultation_channel,
  et.task_date
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
WHERE ot.code IN ('OP5', 'OP12')
ORDER BY et.created_at DESC
LIMIT 10;
