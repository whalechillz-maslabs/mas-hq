-- MASLABS 직원 데이터 조회 쿼리문
-- 작성일: 2025-09-09
-- 목적: 현재 저장된 모든 직원 정보 확인

-- 1. 직원 기본 정보 조회 (입사일 순)
SELECT 
    e.name AS "직원명",
    e.employee_id AS "직원ID",
    e.email AS "이메일",
    e.phone AS "전화번호",
    d.name AS "부서",
    p.name AS "직책",
    CASE 
        WHEN e.employment_type = 'full_time' THEN '월급제'
        WHEN e.employment_type = 'part_time' THEN '시급제'
        ELSE e.employment_type
    END AS "고용형태",
    CASE 
        WHEN e.monthly_salary IS NOT NULL THEN CONCAT(e.monthly_salary::text, '원')
        WHEN e.hourly_rate IS NOT NULL THEN CONCAT(e.hourly_rate::text, '원/시간')
        ELSE '미설정'
    END AS "급여",
    e.hire_date AS "입사일",
    e.status AS "상태",
    e.created_at AS "생성일",
    e.updated_at AS "수정일"
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
ORDER BY e.hire_date ASC, e.employee_id ASC;

-- 2. 시급 데이터 조회
SELECT 
    e.name AS "직원명",
    e.employee_id AS "직원ID",
    hw.base_wage AS "기본시급",
    hw.overtime_multiplier AS "초과근무배수",
    hw.night_multiplier AS "야간근무배수",
    hw.holiday_multiplier AS "휴일근무배수",
    hw.effective_start_date AS "적용시작일",
    hw.effective_end_date AS "적용종료일",
    hw.status AS "상태",
    hw.created_at AS "생성일"
FROM hourly_wages hw
INNER JOIN employees e ON hw.employee_id = e.id
ORDER BY hw.effective_start_date DESC, e.name ASC;

-- 3. 부서별 직원 수 통계
SELECT 
    d.name AS "부서명",
    COUNT(e.id) AS "직원수",
    STRING_AGG(e.name, ', ' ORDER BY e.name) AS "직원명"
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY COUNT(e.id) DESC, d.name ASC;

-- 4. 고용형태별 통계
SELECT 
    CASE 
        WHEN employment_type = 'full_time' THEN '월급제'
        WHEN employment_type = 'part_time' THEN '시급제'
        ELSE employment_type
    END AS "고용형태",
    COUNT(*) AS "직원수",
    STRING_AGG(name, ', ' ORDER BY name) AS "직원명"
FROM employees
GROUP BY employment_type
ORDER BY COUNT(*) DESC;

-- 5. 급여 현황 통계
SELECT 
    '월급 총액' AS "구분",
    SUM(monthly_salary) AS "금액",
    COUNT(*) AS "직원수"
FROM employees 
WHERE monthly_salary IS NOT NULL

UNION ALL

SELECT 
    '시급제 직원' AS "구분",
    NULL AS "금액",
    COUNT(*) AS "직원수"
FROM employees 
WHERE hourly_rate IS NOT NULL

UNION ALL

SELECT 
    '전체 직원' AS "구분",
    NULL AS "금액",
    COUNT(*) AS "직원수"
FROM employees;

-- 6. 입사일별 통계
SELECT 
    DATE_TRUNC('month', hire_date) AS "입사월",
    COUNT(*) AS "입사자수",
    STRING_AGG(name, ', ' ORDER BY name) AS "직원명"
FROM employees
GROUP BY DATE_TRUNC('month', hire_date)
ORDER BY DATE_TRUNC('month', hire_date) ASC;
