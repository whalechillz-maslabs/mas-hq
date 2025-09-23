-- ========================================
-- 3단계: 통합 뷰들 생성
-- 실행일: 2025-01-27
-- 설명: 개선된 통합 뷰들 생성
-- ========================================

-- 3-1. 계약서와 직원 정보 조인 뷰 (개선된 버전)
CREATE OR REPLACE VIEW contracts_with_employees AS
SELECT 
    c.id,
    c.employee_id,
    c.contract_type,
    c.start_date,
    c.end_date,
    c.salary,
    c.work_hours,
    c.work_days,
    c.work_time,
    c.lunch_break,
    c.meal_allowance,
    c.includes_weekly_holiday,
    c.status,
    c.employee_signature,
    c.employer_signature,
    c.documents,
    c.salary_history,
    c.probation_period,
    c.created_at,
    c.updated_at,
    c.signed_at,
    -- 직원 정보
    e.name as employee_name,
    e.employee_id as employee_code,
    e.employment_type,
    e.hire_date,
    e.phone,
    e.email,
    e.nickname,
    -- 부서 및 직급 정보
    d.name as department_name,
    p.name as position_name,
    r.name as role_name
FROM contracts c
LEFT JOIN employees e ON c.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id;

-- 3-2. 직원 상세 정보 뷰 (개선된 버전)
CREATE OR REPLACE VIEW employee_details AS
SELECT 
    e.id,
    e.employee_id,
    e.name,
    e.nickname,
    e.email,
    e.phone,
    e.status,
    e.employment_type,
    e.hire_date,
    e.last_login,
    e.monthly_salary,
    e.hourly_rate,
    e.salary_structure,
    e.leave_anniversary_date,
    -- 부서 및 직급 정보
    d.name as department_name,
    d.id as department_id,
    p.name as position_name,
    p.id as position_id,
    r.name as role_name,
    r.id as role_id,
    -- 현재 활성 계약 정보
    c.id as current_contract_id,
    c.contract_type as current_contract_type,
    c.salary as current_salary,
    c.meal_allowance as current_meal_allowance,
    c.status as contract_status
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
LEFT JOIN contracts c ON e.id = c.employee_id 
    AND c.status = 'active' 
    AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE);

-- 완료 메시지
SELECT '3단계: 통합 뷰들이 성공적으로 생성되었습니다' as result;

