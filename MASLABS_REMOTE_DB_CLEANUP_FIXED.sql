-- ================================================
-- MASLABS 원격 Supabase 디비 정리 최종 SQL (수정본)
-- Version: 2.0.1
-- Created: 2025-08-25
-- Description: 원격 디비에서 불필요한 테이블들을 삭제하고 
--              새로운 직원 데이터와 OP1~OP10 업무 유형을 설정
-- ================================================

-- 1. 현재 상태 확인
DO $$
DECLARE
    table_count INTEGER;
    table_list TEXT;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    SELECT STRING_AGG(table_name, ', ' ORDER BY table_name) INTO table_list
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '=== 현재 원격 디비 상태 ===';
    RAISE NOTICE '총 테이블 수: %개', table_count;
    RAISE NOTICE '테이블 목록: %', table_list;
END $$;

-- 2. 불필요한 테이블들 삭제
-- audit_logs 관련
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP INDEX IF EXISTS idx_audit_user;
DROP INDEX IF EXISTS idx_audit_entity;
DROP INDEX IF EXISTS idx_audit_action;
DROP INDEX IF EXISTS idx_audit_created;

-- contracts 관련
DROP TABLE IF EXISTS contracts CASCADE;

-- documents 관련
DROP TABLE IF EXISTS documents CASCADE;

-- employee_details 관련 (테이블 또는 뷰)
DO $$
BEGIN
    DROP TABLE IF EXISTS employee_details CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        DROP VIEW IF EXISTS employee_details CASCADE;
END $$;

-- notifications 관련
DROP TABLE IF EXISTS notifications CASCADE;

-- operation_type_permissions 관련
DROP TABLE IF EXISTS operation_type_permissions CASCADE;

-- operation_types_backup 관련
DROP TABLE IF EXISTS operation_types_backup CASCADE;

-- operation_types_by_points 관련 (테이블 또는 뷰)
DO $$
BEGIN
    DROP TABLE IF EXISTS operation_types_by_points CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        DROP VIEW IF EXISTS operation_types_by_points CASCADE;
END $$;

-- performance_metrics 관련
DROP TABLE IF EXISTS performance_metrics CASCADE;

-- salaries 관련
DROP TABLE IF EXISTS salaries CASCADE;

-- sessions 관련
DROP TABLE IF EXISTS sessions CASCADE;

-- task_performance_summary 관련 (테이블 또는 뷰)
DO $$
BEGIN
    DROP TABLE IF EXISTS task_performance_summary CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        DROP VIEW IF EXISTS task_performance_summary CASCADE;
END $$;

-- kpi_operation_types_summary 관련 (테이블 또는 뷰)
DO $$
BEGIN
    DROP TABLE IF EXISTS kpi_operation_types_summary CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        DROP VIEW IF EXISTS kpi_operation_types_summary CASCADE;
END $$;

-- monthly_attendance_summary 관련 (테이블 또는 뷰)
DO $$
BEGIN
    DROP TABLE IF EXISTS monthly_attendance_summary CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        DROP VIEW IF EXISTS monthly_attendance_summary CASCADE;
END $$;

-- 3. 핵심 테이블 구조 확인 및 수정
-- departments 테이블 업데이트
DO $$
BEGIN
    -- 운영팀(HQ), 싱싱팀(SING), 마스팀(MAS) 구조로 업데이트
    UPDATE departments SET 
        name = '운영팀',
        code = 'HQ',
        description = '본사 운영 관리'
    WHERE code = 'OP' OR name = '경영지원팀';
    
    -- 싱싱팀 추가 (없는 경우)
    IF NOT EXISTS (SELECT 1 FROM departments WHERE code = 'SING') THEN
        INSERT INTO departments (name, code, description) 
        VALUES ('싱싱팀', 'SING', '싱싱 관련 업무');
    END IF;
    
    -- 마스팀 추가 (없는 경우)
    IF NOT EXISTS (SELECT 1 FROM departments WHERE code = 'MAS') THEN
        INSERT INTO departments (name, code, description) 
        VALUES ('마스팀', 'MAS', '마스 관련 업무');
    END IF;
    
    RAISE NOTICE '✅ 부서 구조 업데이트 완료';
END $$;

-- positions 테이블 업데이트
DO $$
BEGIN
    -- 필요한 직급들 추가
    INSERT INTO positions (name, description) VALUES 
        ('대표이사', '회사 대표'),
        ('부장', '부서장'),
        ('과장', '팀장'),
        ('사원', '일반 사원'),
        ('팀원', '팀 구성원'),
        ('파트타임', '시간제 근무자')
    ON CONFLICT (name) DO NOTHING;
    
    RAISE NOTICE '✅ 직급 데이터 업데이트 완료';
END $$;

-- roles 테이블 업데이트
DO $$
BEGIN
    -- 필요한 역할들 추가
    INSERT INTO roles (name, description) VALUES 
        ('admin', '시스템 관리자'),
        ('manager', '매니저'),
        ('team_lead', '팀장'),
        ('employee', '일반 직원'),
        ('part_time', '파트타임')
    ON CONFLICT (name) DO NOTHING;
    
    RAISE NOTICE '✅ 역할 데이터 업데이트 완료';
END $$;

-- 4. operation_types 테이블 정리 및 OP1~OP10 설정
DO $$
BEGIN
    -- 기존 operation_types 삭제
    DELETE FROM operation_types;
    
    -- 새로운 OP1~OP10 업무 유형 삽입
    INSERT INTO operation_types (code, name, description, category, points, target_roles) VALUES 
        ('OP1', '전화 판매(신규)', '신규 고객 전화 판매', 'phone', 20, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
        ('OP2', '전화 판매(재구매/부품)', '재구매/부품 전화 판매', 'phone', 15, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
        ('OP3', '오프라인 판매(신규)', '신규 고객 오프라인 판매', 'offline', 40, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
        ('OP4', '오프라인 판매(재구매/부품)', '재구매/부품 오프라인 판매', 'offline', 30, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
        ('OP5', 'CS 응대(기본)', '프로모션 설명, 인트라넷/노션 정보 입력, 시타예약 입력', 'support', 8, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
        ('OP6', 'A/S 처리(고급)', '고급 A/S 처리', 'support', 15, ARRAY['admin', 'manager', 'team_lead']),
        ('OP7', '환불 방어', '환불 방어 성공', 'return', 25, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
        ('OP8', '환불 처리', '기존 판매 점수 그대로 차감', 'return', 0, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
        ('OP9', '택배 입고/출고/회수', '상품 관련 택배 처리', 'logistics', 8, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
        ('OP10', '기타 택배/서비스', '음료/소모품/선물 등 기타', 'logistics', 5, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']);
    
    RAISE NOTICE '✅ OP1~OP10 업무 유형 설정 완료';
END $$;

-- 5. employees 테이블 정리 및 새로운 직원 데이터 삽입
DO $$
BEGIN
    -- 기존 직원 데이터 삭제
    DELETE FROM employees;
    
    -- 새로운 직원 데이터 삽입 (9명)
    
    -- 1. 김탁수(WHA) - 운영팀 admin
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-001',
        '김탁수',
        'kim.taksu@maslabs.kr',
        '010-6669-9000',
        '66699000',
        '1234',
        '2025-08-19',
        (SELECT id FROM departments WHERE code = 'HQ'),
        (SELECT id FROM positions WHERE name = '대표이사'),
        (SELECT id FROM roles WHERE name = 'admin'),
        'full_time',
        'active',
        true,
        'WHA'
    );

    -- 2. 이은정(STE) - 운영팀 manager
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-002',
        '이은정',
        'lee.eunjung@maslabs.kr',
        '010-3243-3099',
        '32433099',
        '1234',
        '2025-08-19',
        (SELECT id FROM departments WHERE code = 'HQ'),
        (SELECT id FROM positions WHERE name = '부장'),
        (SELECT id FROM roles WHERE name = 'manager'),
        'full_time',
        'active',
        true,
        'STE'
    );

    -- 3. 허상원(HEO) - 운영팀 employee
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-003',
        '허상원',
        'heo.sangwon@maslabs.kr',
        '010-8948-4501',
        '89484501',
        '1234',
        '2025-08-19',
        (SELECT id FROM departments WHERE code = 'HQ'),
        (SELECT id FROM positions WHERE name = '사원'),
        (SELECT id FROM roles WHERE name = 'employee'),
        'full_time',
        'active',
        true,
        'HEO'
    );

    -- 4. 하상희(HA) - 디자인팀 part_time
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-004',
        '하상희',
        'ha.sanghee@maslabs.kr',
        '010-2576-7885',
        '25767885',
        '1234',
        '2025-08-19',
        (SELECT id FROM departments WHERE code = 'DESIGN'),
        (SELECT id FROM positions WHERE name = '파트타임'),
        (SELECT id FROM roles WHERE name = 'part_time'),
        'part_time',
        'active',
        true,
        'HA'
    );

    -- 5. 최형호(EAR) - 마스팀 team_lead
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-005',
        '최형호',
        'choi.hyungho@maslabs.kr',
        '010-7128-4590',
        '71284590',
        '1234',
        '2025-08-19',
        (SELECT id FROM departments WHERE code = 'MAS'),
        (SELECT id FROM positions WHERE name = '과장'),
        (SELECT id FROM roles WHERE name = 'team_lead'),
        'full_time',
        'active',
        true,
        'EAR'
    );

    -- 6. 박진(JIN) - 마스팀 팀원 part_time
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-006',
        '박진',
        'park.jin@maslabs.kr',
        '010-9132-4337',
        '91324337',
        '1234',
        '2025-08-20',
        (SELECT id FROM departments WHERE code = 'MAS'),
        (SELECT id FROM positions WHERE name = '팀원'),
        (SELECT id FROM roles WHERE name = 'part_time'),
        'part_time',
        'active',
        true,
        'JIN'
    );

    -- 7. 최주희(JH) - 마스팀 part_time
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-007',
        '최주희',
        'choi.juhee@maslabs.kr',
        '010-7110-2030',
        '71102030',
        '1234',
        '2025-08-20',
        (SELECT id FROM departments WHERE code = 'MAS'),
        (SELECT id FROM positions WHERE name = '파트타임'),
        (SELECT id FROM roles WHERE name = 'part_time'),
        'part_time',
        'active',
        true,
        'JH'
    );

    -- 8. 나수진(NA) - 싱싱팀 team_lead
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-008',
        '나수진',
        'na.sujin@maslabs.kr',
        '010-2391-4431',
        '23914431',
        '1234',
        '2025-08-19',
        (SELECT id FROM departments WHERE code = 'SING'),
        (SELECT id FROM positions WHERE name = '과장'),
        (SELECT id FROM roles WHERE name = 'team_lead'),
        'full_time',
        'active',
        true,
        'NA'
    );

    -- 9. 홍미정(HONG) - 싱싱팀 part_time
    INSERT INTO employees (
        employee_id, name, email, phone, password_hash, pin_code,
        hire_date, department_id, position_id, role_id,
        employment_type, status, is_active, nickname
    ) VALUES (
        'MASLABS-009',
        '홍미정',
        'hong.mijeong@maslabs.kr',
        '010-8589-2308',
        '85892308',
        '1234',
        '2025-08-19',
        (SELECT id FROM departments WHERE code = 'SING'),
        (SELECT id FROM positions WHERE name = '파트타임'),
        (SELECT id FROM roles WHERE name = 'part_time'),
        'part_time',
        'active',
        true,
        'HONG'
    );
    
    RAISE NOTICE '✅ 9명 직원 데이터 삽입 완료';
END $$;

-- 6. daily_performance_records 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS daily_performance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    sales_amount DECIMAL(10,2) DEFAULT 0,
    service_amount DECIMAL(10,2) DEFAULT 0,
    new_call_count INTEGER DEFAULT 0,
    purchase_call_count INTEGER DEFAULT 0,
    service_call_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, record_date)
);

-- 7. daily_performance_summary 뷰 생성
CREATE OR REPLACE VIEW daily_performance_summary AS
SELECT 
    dpr.record_date,
    e.name as employee_name,
    e.employee_id,
    d.name as department_name,
    dpr.sales_amount,
    dpr.service_amount,
    dpr.new_call_count,
    dpr.purchase_call_count,
    dpr.service_call_count,
    (dpr.sales_amount + dpr.service_amount) as total_amount
FROM daily_performance_records dpr
JOIN employees e ON dpr.employee_id = e.id
JOIN departments d ON e.department_id = d.id
ORDER BY dpr.record_date DESC, e.name;

-- 8. team_performance_summary 뷰 생성
CREATE OR REPLACE VIEW team_performance_summary AS
SELECT 
    d.name as department_name,
    d.code as department_code,
    COUNT(DISTINCT e.id) as employee_count,
    SUM(dpr.sales_amount) as total_sales,
    SUM(dpr.service_amount) as total_service,
    SUM(dpr.new_call_count) as total_new_calls,
    SUM(dpr.purchase_call_count) as total_purchase_calls,
    SUM(dpr.service_call_count) as total_service_calls,
    STRING_AGG(DISTINCT ot.code, ', ' ORDER BY ot.code) as operation_types
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
LEFT JOIN daily_performance_records dpr ON e.id = dpr.employee_id
LEFT JOIN operation_types ot ON ot.target_roles @> ARRAY[e.role_id::text]
GROUP BY d.id, d.name, d.code
ORDER BY d.name;

-- 9. 삭제 후 상태 확인
DO $$
DECLARE
    remaining_count INTEGER;
    remaining_tables TEXT;
    employee_count INTEGER;
    operation_count INTEGER;
    department_count INTEGER;
BEGIN
    -- 남은 테이블 확인
    SELECT COUNT(*) INTO remaining_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    SELECT STRING_AGG(table_name, ', ' ORDER BY table_name) INTO remaining_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- 직원 수 확인
    SELECT COUNT(*) INTO employee_count FROM employees;
    
    -- 업무 유형 수 확인
    SELECT COUNT(*) INTO operation_count FROM operation_types;
    
    -- 부서 수 확인
    SELECT COUNT(*) INTO department_count FROM departments;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== 원격 디비 정리 완료 ===';
    RAISE NOTICE '';
    RAISE NOTICE '📊 최종 상태:';
    RAISE NOTICE '   • 남은 테이블 수: %개', remaining_count;
    RAISE NOTICE '   • 직원 수: %명', employee_count;
    RAISE NOTICE '   • 업무 유형: %개 (OP1~OP10)', operation_count;
    RAISE NOTICE '   • 부서 수: %개', department_count;
    RAISE NOTICE '';
    RAISE NOTICE '🏢 핵심 부서:';
    RAISE NOTICE '   • 운영팀(HQ): 본사 운영 관리';
    RAISE NOTICE '   • 싱싱팀(SING): 싱싱 관련 업무';
    RAISE NOTICE '   • 마스팀(MAS): 마스 관련 업무';
    RAISE NOTICE '';
    RAISE NOTICE '👥 직원 구성:';
    RAISE NOTICE '   • 김탁수(WHA): 운영팀, 대표이사, admin';
    RAISE NOTICE '   • 이은정(STE): 운영팀, 부장, manager';
    RAISE NOTICE '   • 허상원(HEO): 운영팀, 사원, employee';
    RAISE NOTICE '   • 하상희(HA): 디자인팀, 파트타임, part_time';
    RAISE NOTICE '   • 최형호(EAR): 마스팀, 과장, team_lead';
    RAISE NOTICE '   • 박진(JIN): 마스팀, 팀원, part_time';
    RAISE NOTICE '   • 최주희(JH): 마스팀, 파트타임, part_time';
    RAISE NOTICE '   • 나수진(NA): 싱싱팀, 과장, team_lead';
    RAISE NOTICE '   • 홍미정(HONG): 싱싱팀, 파트타임, part_time';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 원격 디비가 성공적으로 정리되었습니다!';
    RAISE NOTICE '✅ 로컬 디비와 동일한 구조로 설정되었습니다!';
END $$;

-- 10. 최종 직원 목록 출력
SELECT '=== 최종 직원 목록 ===' as info;
SELECT 
    e.employee_id,
    e.name as employee_name,
    e.nickname,
    e.phone,
    e.pin_code,
    e.employment_type,
    d.name as department_name,
    d.code as department_code,
    p.name as position_name,
    r.name as role_name,
    e.is_active
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY e.employee_id;
