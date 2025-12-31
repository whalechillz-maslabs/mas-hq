-- ========================================
-- 복지 연차 정책 및 최형호 연차 설정 확인
-- 실행일: 2025-12-19
-- 설명: 모든 설정이 제대로 되었는지 최종 확인
-- ========================================

-- 1. 복지 연차 정책 테이블 확인
SELECT 
    '복지 연차 정책 테이블 확인' as section,
    COUNT(*) as 정책수,
    COUNT(CASE WHEN is_active = true THEN 1 END) as 활성정책수
FROM welfare_leave_policy;

-- 2. 복지 연차 정책 상세 확인
SELECT 
    '복지 연차 정책 상세' as section,
    year,
    date,
    description,
    is_active,
    created_at
FROM welfare_leave_policy
ORDER BY year DESC, date ASC;

-- 3. RLS 정책 확인
SELECT 
    'RLS 정책 확인' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'welfare_leave_policy'
ORDER BY policyname;

-- 4. RLS 활성화 상태 확인
SELECT 
    'RLS 활성화 상태' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'welfare_leave_policy';

-- 5. 최형호 2026년 연차 확인
SELECT 
    '최형호 2026년 연차 확인' as section,
    e.name as 직원명,
    e.employee_id as 직원번호,
    lb.year as 연도,
    lb.total_days as 총연차,
    lb.used_days as 사용연차,
    lb.remaining_days as 잔여연차,
    lb.leave_anniversary_date as 연차기산일
FROM employees e
JOIN leave_balance lb ON e.id = lb.employee_id AND lb.year = 2026
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004';

-- 6. 최형호 2025년 연차 확인 (기존 데이터)
SELECT 
    '최형호 2025년 연차 확인' as section,
    e.name as 직원명,
    e.employee_id as 직원번호,
    lb.year as 연도,
    lb.total_days as 총연차,
    lb.used_days as 사용연차,
    lb.remaining_days as 잔여연차,
    lb.leave_anniversary_date as 연차기산일
FROM employees e
JOIN leave_balance lb ON e.id = lb.employee_id AND lb.year = 2025
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004';

-- 7. 최형호 연차 신청 내역 확인
SELECT 
    '최형호 연차 신청 내역' as section,
    lr.start_date,
    lr.end_date,
    lr.leave_type,
    lr.leave_days,
    lr.status,
    lr.reason
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
WHERE (e.name = '최형호' OR e.employee_id = 'MASLABS-004')
ORDER BY lr.created_at DESC;

