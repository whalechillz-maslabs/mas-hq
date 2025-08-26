-- ================================================
-- OP 팀 KPI 시스템 단순화 및 재구성
-- Version: 4.0.0
-- Created: 2025-08-24
-- ================================================

-- 1. 기존 KPI 관련 테이블 삭제
DROP TABLE IF EXISTS kpi_results CASCADE;
DROP TABLE IF EXISTS kpi_employee_targets CASCADE;
DROP TABLE IF EXISTS kpi_team_targets CASCADE;
DROP TABLE IF EXISTS kpi_definitions CASCADE;
DROP TABLE IF EXISTS kpi_performances CASCADE;
DROP TABLE IF EXISTS team_kpi_summaries CASCADE;
DROP TABLE IF EXISTS sales_rules CASCADE;
DROP TABLE IF EXISTS amount_based_points CASCADE;
DROP TABLE IF EXISTS cs_task_details CASCADE;
DROP TABLE IF EXISTS logistics_rules CASCADE;
DROP TABLE IF EXISTS refund_processing_rules CASCADE;
DROP TABLE IF EXISTS escalation_rules CASCADE;
DROP TABLE IF EXISTS integrated_task_costs CASCADE;

-- 2. 기존 뷰들 삭제
DROP VIEW IF EXISTS kpi_operation_types_summary CASCADE;
DROP VIEW IF EXISTS operation_types_by_points CASCADE;
DROP VIEW IF EXISTS employee_kpi_summary CASCADE;

-- 3. 기존 함수들 삭제
DROP FUNCTION IF EXISTS calculate_task_points_v2 CASCADE;
DROP FUNCTION IF EXISTS calculate_task_points_v3 CASCADE;
DROP FUNCTION IF EXISTS calculate_task_points_v4 CASCADE;
DROP FUNCTION IF EXISTS calculate_task_points_v5 CASCADE;
DROP FUNCTION IF EXISTS calculate_task_points_v6 CASCADE;
DROP FUNCTION IF EXISTS get_active_operation_types() CASCADE;

-- 4. operation_types 테이블 구조 변경
ALTER TABLE operation_types ADD COLUMN IF NOT EXISTS target_roles TEXT[];

-- 5. 기존 OP 업무 유형 비활성화
UPDATE operation_types SET is_active = false WHERE code LIKE 'OP%';

-- 6. 새로운 OP 업무 유형 10개 삽입
INSERT INTO operation_types (code, name, description, category, points, is_active, target_roles) VALUES
('OP1', '전화 판매(신규)', '신규 고객 전화 판매', 'phone_sales', 20, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
('OP2', '전화 판매(재구매/부품)', '재구매 또는 부품(헤드/샤프트) 전화 판매', 'phone_sales', 15, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
('OP3', '오프라인 판매(신규)', '신규 고객 오프라인 판매', 'offline_sales', 40, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
('OP4', '오프라인 판매(재구매/부품)', '재구매 또는 부품(헤드/샤프트) 오프라인 판매', 'offline_sales', 30, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
('OP5', 'CS 응대(기본)', '프로모션 설명, 인트라넷/노션 정보 입력, 시타예약 입력', 'support', 8, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
('OP6', 'A/S 처리(고급)', '고객 재방문 케어, 재시타 등 전문적인 A/S 처리', 'support', 15, true, ARRAY['team_lead', 'manager']),
('OP7', '환불 방어', '전화, 시타 서비스 등을 통한 환불 방어 성공', 'returns', 25, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
('OP8', '환불 처리', '불완전 판매 등으로 인한 환불 처리 (기존 판매 점수 그대로 차감)', 'returns', 0, true, ARRAY['employee', 'team_lead', 'manager']),
('OP9', '택배 입고/출고/회수 (상품)', '상품 관련 택배 입고, 출고, 회수 처리', 'logistics', 8, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time']),
('OP10', '기타 택배/서비스', '음료/소모품/선물 등 기타 택배 입고, 고객/협력업체 선물 출고 서비스 등', 'logistics', 5, true, ARRAY['admin', 'manager', 'team_lead', 'employee', 'part_time'])
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    points = EXCLUDED.points,
    is_active = EXCLUDED.is_active,
    target_roles = EXCLUDED.target_roles,
    updated_at = CURRENT_TIMESTAMP;

-- 7. 일일 성과 기록 테이블 생성
CREATE TABLE IF NOT EXISTS daily_performance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- 업무 유형
    op_type_code VARCHAR(20) NOT NULL REFERENCES operation_types(code) ON DELETE RESTRICT,
    
    -- 금액 관련
    sales_amount NUMERIC(12, 2) DEFAULT 0.00, -- 판매 금액
    service_amount NUMERIC(12, 2) DEFAULT 0.00, -- 서비스 금액
    
    -- 콜 수 관련
    new_call_count INTEGER DEFAULT 0, -- 신규 콜 수
    purchase_call_count INTEGER DEFAULT 0, -- 구매 관련 콜 수
    service_call_count INTEGER DEFAULT 0, -- 서비스 관련 콜 수
    
    -- 수량 및 기타
    quantity INTEGER DEFAULT 1, -- 처리 수량
    customer_count INTEGER DEFAULT 0, -- 고객 수
    
    -- 상태 및 메모
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
    notes TEXT, -- 메모
    
    -- 검증
    verified_by UUID REFERENCES employees(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 제약 조건: 한 직원이 같은 날 같은 OP 업무에 대해 중복 기록 방지
    UNIQUE (employee_id, record_date, op_type_code)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_daily_performance_employee_date ON daily_performance_records(employee_id, record_date);
CREATE INDEX IF NOT EXISTS idx_daily_performance_op_type ON daily_performance_records(op_type_code);
CREATE INDEX IF NOT EXISTS idx_daily_performance_date ON daily_performance_records(record_date);

-- 8. 일일 성과 요약 뷰 생성
CREATE OR REPLACE VIEW daily_performance_summary AS
SELECT 
    dpr.record_date,
    e.id as employee_id,
    e.name as employee_name,
    e.employee_id as employee_code,
    d.name as department_name,
    r.name as role_name,
    
    -- 업무별 성과
    COUNT(DISTINCT dpr.op_type_code) as task_types_count,
    SUM(dpr.sales_amount) as total_sales_amount,
    SUM(dpr.service_amount) as total_service_amount,
    SUM(dpr.new_call_count) as total_new_calls,
    SUM(dpr.purchase_call_count) as total_purchase_calls,
    SUM(dpr.service_call_count) as total_service_calls,
    SUM(dpr.quantity) as total_quantity,
    SUM(dpr.customer_count) as total_customers,
    
    -- 포인트 계산
    SUM(ot.points * dpr.quantity) as total_points,
    
    -- 상태별 카운트
    COUNT(CASE WHEN dpr.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN dpr.status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN dpr.status = 'cancelled' THEN 1 END) as cancelled_tasks
    
FROM daily_performance_records dpr
JOIN employees e ON dpr.employee_id = e.id
JOIN departments d ON e.department_id = d.id
JOIN roles r ON e.role_id = r.id
JOIN operation_types ot ON dpr.op_type_code = ot.code
WHERE e.status = 'active'
GROUP BY dpr.record_date, e.id, e.name, e.employee_id, d.name, r.name
ORDER BY dpr.record_date DESC, e.name;

-- 9. 팀별 성과 요약 뷰 생성
CREATE OR REPLACE VIEW team_performance_summary AS
SELECT 
    dpr.record_date,
    d.id as department_id,
    d.name as department_name,
    COUNT(DISTINCT e.id) as employee_count,
    
    -- 팀 성과
    SUM(dpr.sales_amount) as team_total_sales,
    SUM(dpr.service_amount) as team_total_service,
    SUM(dpr.new_call_count) as team_total_new_calls,
    SUM(dpr.purchase_call_count) as team_total_purchase_calls,
    SUM(dpr.service_call_count) as team_total_service_calls,
    
    -- 팀 포인트
    SUM(ot.points * dpr.quantity) as team_total_points,
    AVG(ot.points * dpr.quantity) as team_avg_points_per_employee,
    
    -- 업무 유형별 분포
    STRING_AGG(DISTINCT ot.code, ', ') as task_distribution
    
FROM daily_performance_records dpr
JOIN employees e ON dpr.employee_id = e.id
JOIN departments d ON e.department_id = d.id
JOIN operation_types ot ON dpr.op_type_code = ot.code
WHERE e.status = 'active'
GROUP BY dpr.record_date, d.id, d.name
ORDER BY dpr.record_date DESC, d.name;

-- 10. 확인 메시지
DO $$
BEGIN
    RAISE NOTICE 'OP 팀 KPI 시스템 단순화 및 재구성 마이그레이션 완료.';
    RAISE NOTICE '기존 KPI 관련 테이블 삭제, operation_types 업데이트 및 daily_performance_records 테이블이 생성되었습니다.';
END $$;
