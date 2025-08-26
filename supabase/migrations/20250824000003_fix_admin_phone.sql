-- ================================================
-- System Admin 전화번호 수정
-- Version: 4.3.0
-- Created: 2025-08-24
-- ================================================

-- System Admin 전화번호를 올바른 번호로 수정
UPDATE employees 
SET phone = '010-6669-9000', 
    updated_at = CURRENT_TIMESTAMP 
WHERE employee_id = 'MASLABS-001';

-- 수정 확인
DO $$
DECLARE
    admin_phone VARCHAR;
BEGIN
    SELECT phone INTO admin_phone 
    FROM employees 
    WHERE employee_id = 'MASLABS-001';
    
    RAISE NOTICE 'System Admin 전화번호 수정 완료: %', admin_phone;
    
    IF admin_phone = '010-6669-9000' THEN
        RAISE NOTICE '✅ 전화번호가 올바르게 수정되었습니다.';
    ELSE
        RAISE NOTICE '❌ 전화번호 수정에 실패했습니다.';
    END IF;
END $$;
