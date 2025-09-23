-- ========================================
-- 뷰 정리 및 마이그레이션 통합 스크립트
-- 실행일: 2025-01-27
-- 설명: 중복된 뷰 정리 및 hourly_wages → contracts 마이그레이션
-- ========================================

-- 1. 기존 중복 뷰들 정리
DROP VIEW IF EXISTS contracts_with_employees CASCADE;
DROP VIEW IF EXISTS employee_details CASCADE;
DROP VIEW IF EXISTS monthly_attendance_summary CASCADE;

-- 2. 통합된 뷰들 재생성

-- 2-1. 계약서와 직원 정보 조인 뷰 (개선된 버전)
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

-- 2-2. 직원 상세 정보 뷰 (개선된 버전)
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

-- 2-3. 월별 근태 요약 뷰 (개선된 버전)
CREATE OR REPLACE VIEW monthly_attendance_summary AS
SELECT 
    s.employee_id,
    e.name as employee_name,
    e.employment_type,
    DATE_TRUNC('month', s.schedule_date) as month,
    COUNT(*) as total_scheduled_days,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as worked_days,
    COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancelled_days,
    SUM(CASE WHEN s.status = 'completed' THEN s.total_hours ELSE 0 END) as total_worked_hours,
    SUM(CASE WHEN s.status = 'completed' THEN s.overtime_hours ELSE 0 END) as total_overtime_hours,
    -- 시급 정보 (최신)
    hw.base_wage as current_hourly_rate,
    -- 급여 계산
    SUM(CASE WHEN s.status = 'completed' THEN s.total_hours * hw.base_wage ELSE 0 END) as estimated_wage
FROM schedules s
LEFT JOIN employees e ON s.employee_id = e.id
LEFT JOIN LATERAL (
    SELECT base_wage 
    FROM hourly_wages hw2 
    WHERE hw2.employee_id = s.employee_id 
        AND hw2.effective_start_date <= s.schedule_date
        AND (hw2.effective_end_date IS NULL OR hw2.effective_end_date >= s.schedule_date)
        AND hw2.status = 'active'
    ORDER BY hw2.effective_start_date DESC 
    LIMIT 1
) hw ON true
WHERE s.schedule_date >= '2024-01-01' -- 최근 1년 데이터만
GROUP BY s.employee_id, e.name, e.employment_type, DATE_TRUNC('month', s.schedule_date), hw.base_wage
ORDER BY s.employee_id, month DESC;

-- 2-4. 급여 요약 뷰 (새로 추가)
CREATE OR REPLACE VIEW payslip_summary AS
SELECT 
    p.id,
    p.employee_id,
    e.name as employee_name,
    e.employment_type,
    p.salary_period,
    p.payment_date,
    p.base_salary,
    p.overtime_pay,
    p.meal_allowance,
    p.incentive,
    p.point_bonus,
    p.total_earnings,
    p.tax_amount,
    p.net_salary,
    p.status,
    p.created_at
FROM payslips p
LEFT JOIN employees e ON p.employee_id = e.id
ORDER BY p.payment_date DESC, e.name;

-- 3. hourly_wages 데이터를 contracts로 마이그레이션
-- (기존 contracts 데이터와 중복되지 않도록 주의)

-- 3-1. 최형호의 기존 hourly_wages 데이터를 contracts로 이관
INSERT INTO contracts (
    employee_id,
    contract_type,
    start_date,
    end_date,
    salary,
    work_hours,
    work_days,
    work_time,
    lunch_break,
    meal_allowance,
    includes_weekly_holiday,
    status,
    salary_history,
    probation_period
)
SELECT 
    hw.employee_id,
    'part_time' as contract_type,
    hw.effective_start_date as start_date,
    hw.effective_end_date as end_date,
    hw.base_wage as salary,
    7 as work_hours,
    5 as work_days,
    '09:00-17:00' as work_time,
    1 as lunch_break,
    140000 as meal_allowance, -- 최형호 식대
    true as includes_weekly_holiday,
    'active' as status,
    -- 급여 변동 이력 (최형호의 경우)
    CASE 
        WHEN e.name = '최형호' THEN 
            '[
                {
                    "effective_date": "2025-08-01",
                    "salary": 13000,
                    "reason": "초기 시급",
                    "notes": "입사 시 적용된 시급"
                },
                {
                    "effective_date": "2025-08-08", 
                    "salary": 12000,
                    "reason": "업무 숙련도 향상 필요",
                    "notes": "업무 미숙으로 인한 시급 조정"
                }
            ]'::jsonb
        ELSE NULL
    END as salary_history,
    -- 수습기간 설정 (최형호의 경우)
    CASE 
        WHEN e.name = '최형호' THEN 
            '{
                "start_date": "2025-08-01",
                "end_date": "2025-08-31", 
                "minimum_wage": true
            }'::jsonb
        ELSE NULL
    END as probation_period
FROM hourly_wages hw
JOIN employees e ON hw.employee_id = e.id
WHERE hw.status = 'active'
    AND e.name = '최형호'
    AND NOT EXISTS (
        -- 이미 contracts에 데이터가 있는지 확인
        SELECT 1 FROM contracts c 
        WHERE c.employee_id = hw.employee_id 
        AND c.start_date = hw.effective_start_date
    );

-- 4. 마이그레이션 결과 확인
SELECT 
    'Migration Results' as section,
    e.name as employee_name,
    c.contract_type,
    c.start_date,
    c.end_date,
    c.salary,
    c.meal_allowance,
    c.salary_history,
    c.probation_period
FROM contracts c
JOIN employees e ON c.employee_id = e.id
WHERE e.name = '최형호'
ORDER BY c.start_date;

-- 5. 뷰 생성 결과 확인
SELECT 
    'View Creation Results' as section,
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname IN ('contracts_with_employees', 'employee_details', 'monthly_attendance_summary', 'payslip_summary')
ORDER BY viewname;

-- 6. 완료 메시지
SELECT 'Views cleaned up and hourly_wages data migrated to contracts successfully' as result;
