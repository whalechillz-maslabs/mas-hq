-- 환불 처리 업무 확인
SELECT 
    et.id,
    et.title,
    et.quantity,
    et.sales_amount,
    ot.code as operation_code,
    ot.points as operation_points,
    (ot.points * et.quantity) as calculated_points
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
WHERE et.title LIKE '%환불 처리%'
ORDER BY et.created_at DESC
LIMIT 5;

-- 최근 생성된 업무들 확인
SELECT 
    et.id,
    et.title,
    et.quantity,
    et.sales_amount,
    ot.code as operation_code,
    ot.points as operation_points,
    (ot.points * et.quantity) as calculated_points,
    et.created_at
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
ORDER BY et.created_at DESC
LIMIT 10;
