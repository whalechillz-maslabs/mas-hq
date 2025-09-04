-- 팀별 KPI 뷰 생성

-- 1. 팀별 일일 매출 및 포인트 뷰
CREATE OR REPLACE VIEW team_daily_kpi AS
SELECT 
    COALESCE(d.name, '미분류') as team_name,
    DATE(et.task_date) as task_date,
    COUNT(*) as task_count,
    SUM(et.sales_amount) as total_sales,
    SUM(ot.points) as total_points,
    COUNT(DISTINCT et.employee_id) as active_employees
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
JOIN employees e ON et.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
WHERE et.task_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.name, DATE(et.task_date)
ORDER BY task_date DESC, team_name;

-- 2. 팀별 월간 KPI 뷰
CREATE OR REPLACE VIEW team_monthly_kpi AS
SELECT 
    COALESCE(d.name, '미분류') as team_name,
    DATE_TRUNC('month', et.task_date) as month,
    COUNT(*) as task_count,
    SUM(et.sales_amount) as total_sales,
    SUM(ot.points) as total_points,
    COUNT(DISTINCT et.employee_id) as active_employees,
    ROUND(AVG(et.sales_amount), 0) as avg_sales_per_task
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
JOIN employees e ON et.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
WHERE et.task_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
GROUP BY d.name, DATE_TRUNC('month', et.task_date)
ORDER BY month DESC, team_name;

-- 3. 팀별 직원 수 통계 뷰
CREATE OR REPLACE VIEW team_employee_stats AS
SELECT 
    COALESCE(d.name, '미분류') as team_name,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_employees,
    COUNT(CASE WHEN DATE(e.last_login) = CURRENT_DATE THEN 1 END) as today_logged_in,
    COUNT(CASE WHEN e.employment_type = 'full_time' THEN 1 END) as full_time_employees,
    COUNT(CASE WHEN e.employment_type = 'part_time' THEN 1 END) as part_time_employees
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
GROUP BY d.name
ORDER BY team_name;

-- 4. 전체 KPI 요약 뷰
CREATE OR REPLACE VIEW overall_kpi_summary AS
SELECT 
    '전체' as category,
    COUNT(DISTINCT e.id) as total_employees,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_employees,
    COUNT(DISTINCT CASE WHEN DATE(e.last_login) = CURRENT_DATE THEN e.id END) as today_logged_in,
    COALESCE(SUM(et.sales_amount), 0) as today_sales,
    COALESCE(SUM(ot.points), 0) as today_points,
    COALESCE(COUNT(et.id), 0) as today_tasks
FROM employees e
LEFT JOIN employee_tasks et ON e.id = et.employee_id AND DATE(et.task_date) = CURRENT_DATE
LEFT JOIN operation_types ot ON et.operation_type_id = ot.id
WHERE e.status = 'active';

-- 권한 설정
GRANT SELECT ON team_daily_kpi TO authenticated;
GRANT SELECT ON team_monthly_kpi TO authenticated;
GRANT SELECT ON team_employee_stats TO authenticated;
GRANT SELECT ON overall_kpi_summary TO authenticated;
