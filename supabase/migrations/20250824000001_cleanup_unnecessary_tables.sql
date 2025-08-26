-- ================================================
-- 불필요한 테이블 정리 및 단순화
-- Version: 4.1.0
-- Created: 2025-08-24
-- ================================================

-- 1. 불필요한 테이블 삭제
-- 현재 사용하지 않는 테이블들을 모두 삭제하여 시스템을 단순화합니다.

-- 감사 로그 (기본 기능에 불필요)
DROP TABLE IF EXISTS audit_logs CASCADE;

-- 계약서 (현재 사용 안함)
DROP TABLE IF EXISTS contracts CASCADE;

-- 문서 (현재 사용 안함)
DROP TABLE IF EXISTS documents CASCADE;

-- 직원 상세 (employees와 중복) - 뷰일 수 있음
DO $$ BEGIN
    DROP TABLE IF EXISTS employee_details CASCADE;
EXCEPTION WHEN OTHERS THEN
    DROP VIEW IF EXISTS employee_details CASCADE;
END $$;

-- 월간 출근 요약 (schedules로 대체) - 뷰일 수 있음
DO $$ BEGIN
    DROP TABLE IF EXISTS monthly_attendance_summary CASCADE;
EXCEPTION WHEN OTHERS THEN
    DROP VIEW IF EXISTS monthly_attendance_summary CASCADE;
END $$;

-- 알림 (현재 사용 안함)
DROP TABLE IF EXISTS notifications CASCADE;

-- 업무 유형 권한 (단순화로 불필요)
DROP TABLE IF EXISTS operation_type_permissions CASCADE;

-- 백업 테이블 (불필요)
DROP TABLE IF EXISTS operation_types_backup CASCADE;

-- 성과 지표 (daily_performance_records로 대체)
DROP TABLE IF EXISTS performance_metrics CASCADE;

-- 급여 (현재 사용 안함)
DROP TABLE IF EXISTS salaries CASCADE;

-- 세션 (Supabase Auth로 대체)
DROP TABLE IF EXISTS sessions CASCADE;

-- 작업 성과 요약 (daily_performance_summary로 대체) - 뷰일 수 있음
DO $$ BEGIN
    DROP TABLE IF EXISTS task_performance_summary CASCADE;
EXCEPTION WHEN OTHERS THEN
    DROP VIEW IF EXISTS task_performance_summary CASCADE;
END $$;

-- 2. 불필요한 뷰 삭제 (있다면)
DROP VIEW IF EXISTS employee_kpi_summary CASCADE;
DROP VIEW IF EXISTS kpi_operation_types_summary CASCADE;
DROP VIEW IF EXISTS operation_types_by_points CASCADE;

-- 3. 불필요한 함수 삭제 (있다면)
DROP FUNCTION IF EXISTS calculate_task_points_v2 CASCADE;
DROP FUNCTION IF EXISTS calculate_task_points_v3 CASCADE;
DROP FUNCTION IF EXISTS calculate_task_points_v4 CASCADE;
DROP FUNCTION IF EXISTS calculate_task_points_v5 CASCADE;
DROP FUNCTION IF EXISTS calculate_task_points_v6 CASCADE;
DROP FUNCTION IF EXISTS get_active_operation_types() CASCADE;

-- 4. 핵심 테이블만 남기고 정리
-- 다음 테이블들은 유지됩니다:
-- - departments: 부서 정보
-- - roles: 직급 정보  
-- - employees: 직원 정보
-- - schedules: 근무 스케줄
-- - operation_types: 업무 유형 (OP1~OP10)
-- - daily_performance_records: 일일 성과 기록
-- - employee_tasks: 업무 기록 (기존)

-- 다음 뷰들은 유지됩니다:
-- - daily_performance_summary: 일일 성과 요약
-- - team_performance_summary: 팀 성과 요약

-- 5. 테이블 정리 확인
DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
BEGIN
    -- 테이블 개수 확인
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    -- 뷰 개수 확인
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public';
    
    RAISE NOTICE '정리 완료: %개 테이블, %개 뷰', table_count, view_count;
    RAISE NOTICE '핵심 테이블만 남겨 시스템이 단순화되었습니다.';
END $$;
