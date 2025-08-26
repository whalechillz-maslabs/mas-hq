-- ================================================
-- 기존 KPI 업무 유형 완전 삭제 (OP1~OP10만 유지)
-- Version: 4.4.0
-- Created: 2025-08-24
-- ================================================

-- 1. 기존 KPI 업무 유형들 완전 삭제
-- OP1~OP10을 제외한 모든 업무 유형 삭제
DELETE FROM operation_types 
WHERE code NOT LIKE 'OP%' 
AND code NOT IN ('OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9', 'OP10');

-- 2. 삭제된 업무 유형과 관련된 employee_tasks 기록도 삭제
DELETE FROM employee_tasks 
WHERE operation_type_id NOT IN (
    SELECT id FROM operation_types WHERE code LIKE 'OP%'
);

-- 3. 삭제된 업무 유형과 관련된 daily_performance_records 기록도 삭제
DELETE FROM daily_performance_records 
WHERE op_type_code NOT LIKE 'OP%';

-- 4. 현재 상태 확인
DO $$
DECLARE
    remaining_count INTEGER;
    op_count INTEGER;
BEGIN
    -- 전체 업무 유형 개수
    SELECT COUNT(*) INTO remaining_count FROM operation_types;
    
    -- OP 업무 유형 개수
    SELECT COUNT(*) INTO op_count FROM operation_types WHERE code LIKE 'OP%';
    
    RAISE NOTICE '✅ 업무 유형 정리 완료';
    RAISE NOTICE '총 업무 유형: %개', remaining_count;
    RAISE NOTICE 'OP 업무 유형: %개', op_count;
    
    IF remaining_count = op_count THEN
        RAISE NOTICE '✅ OP1~OP10만 남았습니다!';
    ELSE
        RAISE NOTICE '⚠️  OP 외 다른 업무 유형이 %개 남아있습니다.', (remaining_count - op_count);
    END IF;
END $$;

-- 5. 남은 업무 유형 목록 출력
SELECT 
    code, 
    name, 
    category, 
    points,
    is_active,
    target_roles
FROM operation_types 
ORDER BY code;
