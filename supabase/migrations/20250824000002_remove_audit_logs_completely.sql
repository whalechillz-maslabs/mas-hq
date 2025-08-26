-- ================================================
-- audit_logs 관련 코드 완전 삭제
-- Version: 4.2.0
-- Created: 2025-08-24
-- ================================================

-- 1. audit_logs 관련 트리거 삭제 (테이블이 존재하는 경우에만)
DO $$
BEGIN
    -- employees 테이블이 존재하는 경우에만 트리거 삭제
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        DROP TRIGGER IF EXISTS audit_employees ON employees;
    END IF;
    
    -- salaries 테이블이 존재하는 경우에만 트리거 삭제
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salaries') THEN
        DROP TRIGGER IF EXISTS audit_salaries ON salaries;
    END IF;
    
    -- contracts 테이블이 존재하는 경우에만 트리거 삭제
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
        DROP TRIGGER IF EXISTS audit_contracts ON contracts;
    END IF;
END $$;

-- 2. audit_trigger_function 삭제
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;

-- 3. audit_logs 테이블 삭제 (이미 삭제됨)
DROP TABLE IF EXISTS audit_logs CASCADE;

-- 4. audit_logs 관련 인덱스 삭제
DROP INDEX IF EXISTS idx_audit_user;
DROP INDEX IF EXISTS idx_audit_entity;
DROP INDEX IF EXISTS idx_audit_action;
DROP INDEX IF EXISTS idx_audit_created;

-- 5. 확인 메시지
DO $$
BEGIN
    RAISE NOTICE 'audit_logs 관련 코드 완전 삭제 완료';
    RAISE NOTICE '트리거, 함수, 테이블, 인덱스 모두 제거됨';
END $$;
