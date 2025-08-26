-- 환불 처리를 위한 참조 필드 추가
-- employee_tasks 테이블에 환불 참조 업무 ID 필드 추가

ALTER TABLE employee_tasks 
ADD COLUMN refund_reference_task_id UUID REFERENCES employee_tasks(id);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_refund_reference_task_id ON employee_tasks(refund_reference_task_id);

-- 환불 처리 업무를 쉽게 식별할 수 있도록 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW refund_tasks AS
SELECT 
    t.id,
    t.employee_id,
    t.operation_type_id,
    t.title,
    t.notes,
    t.created_at,
    t.refund_reference_task_id,
    rt.title as original_task_title,
    rt.operation_type_id as original_operation_type_id,
    rt.created_at as original_task_date
FROM employee_tasks t
LEFT JOIN employee_tasks rt ON t.refund_reference_task_id = rt.id
WHERE t.refund_reference_task_id IS NOT NULL;
