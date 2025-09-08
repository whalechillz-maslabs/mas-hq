-- ================================================
-- OP1~OP12 업무 유형 완전 복구
-- 실행일: 2025-09-05
-- 목적: MASLABS_REMOTE_DB_CLEANUP_FINAL.sql로 삭제된 OP11, OP12 복구
-- ================================================

-- 1. 현재 상태 확인
DO $$
DECLARE
    current_count INTEGER;
    op_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count FROM operation_types;
    SELECT COUNT(*) INTO op_count FROM operation_types WHERE code LIKE 'OP%';
    
    RAISE NOTICE '=== 복구 전 상태 ===';
    RAISE NOTICE '총 업무 유형: %개', current_count;
    RAISE NOTICE 'OP 업무 유형: %개', op_count;
END $$;

-- 2. OP11, OP12 업무 유형 추가 (기존 OP1~OP10은 유지)
INSERT INTO operation_types (code, name, description, category, points, is_active, target_roles) VALUES 
('OP11', '전화 판매(싱싱)', '싱싱 리무진 버스 투어상품 신규 고객 전화 판매', 'phone', 20, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
('OP12', 'CS 응대(싱싱)', '싱싱 리무진 버스 투어상품 고객 서비스 및 응대', 'support', 8, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']);

-- 3. 복구 후 상태 확인
DO $$
DECLARE
    final_count INTEGER;
    op_final_count INTEGER;
    op11_exists BOOLEAN;
    op12_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO final_count FROM operation_types;
    SELECT COUNT(*) INTO op_final_count FROM operation_types WHERE code LIKE 'OP%';
    SELECT EXISTS(SELECT 1 FROM operation_types WHERE code = 'OP11') INTO op11_exists;
    SELECT EXISTS(SELECT 1 FROM operation_types WHERE code = 'OP12') INTO op12_exists;
    
    RAISE NOTICE '=== 복구 후 상태 ===';
    RAISE NOTICE '총 업무 유형: %개', final_count;
    RAISE NOTICE 'OP 업무 유형: %개', op_final_count;
    RAISE NOTICE 'OP11 존재: %', op11_exists;
    RAISE NOTICE 'OP12 존재: %', op12_exists;
    
    IF op11_exists AND op12_exists THEN
        RAISE NOTICE '✅ OP1~OP12 업무 유형 복구 완료!';
    ELSE
        RAISE NOTICE '❌ OP11 또는 OP12 복구 실패';
    END IF;
END $$;

-- 4. 모든 OP 업무 유형 목록 출력
SELECT 
    code, 
    name, 
    description,
    category, 
    points,
    is_active,
    target_roles
FROM operation_types 
WHERE code LIKE 'OP%'
ORDER BY code;

