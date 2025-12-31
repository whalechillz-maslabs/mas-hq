-- ========================================
-- 최형호 연차 잔여일 확인 및 생성 (최종 수정)
-- 실행일: 2025-12-19
-- 설명: 최형호의 연차 잔여일 데이터 확인 및 생성
-- ========================================

-- 0. leave_balance 테이블에 leave_anniversary_date 컬럼 추가 (없는 경우)
ALTER TABLE leave_balance 
ADD COLUMN IF NOT EXISTS leave_anniversary_date DATE;

-- 1. 최형호의 연차 잔여일 확인
SELECT 
    '최형호 연차 잔여일 확인' as section,
    e.id,
    e.name,
    e.employee_id,
    e.employment_type,
    e.hire_date,
    e.leave_anniversary_date as employee_anniversary_date,
    lb.year,
    lb.total_days,
    lb.used_days,
    lb.remaining_days,
    COALESCE(lb.leave_anniversary_date, e.leave_anniversary_date) as balance_anniversary_date
FROM employees e
LEFT JOIN leave_balance lb ON e.id = lb.employee_id AND lb.year = 2025
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004';

-- 2. 최형호의 연차 기산일 설정 (2025-10-01)
UPDATE employees 
SET leave_anniversary_date = '2025-10-01'
WHERE (name = '최형호' OR employee_id = 'MASLABS-004')
  AND leave_anniversary_date IS NULL;

-- 3. 최형호의 2025년 연차 잔여일 생성
-- 2025년 10월 1일 입사 기준: 10월~12월 3개월 = 3일 (1년 미만, 매월 개근 시 1일씩)
INSERT INTO leave_balance (employee_id, year, total_days, used_days, leave_anniversary_date)
SELECT 
    id,
    2025,
    3, -- 10월, 11월, 12월 3개월 (1년 미만)
    0, -- 사용 연차 0일
    '2025-10-01' -- 연차 기산일
FROM employees 
WHERE (name = '최형호' OR employee_id = 'MASLABS-004')
ON CONFLICT (employee_id, year) 
DO UPDATE SET 
    total_days = 3,
    leave_anniversary_date = '2025-10-01',
    updated_at = CURRENT_TIMESTAMP;

-- 4. 기존 중복 월차 신청 삭제 (같은 기간의 월차가 있으면 삭제)
DELETE FROM leave_requests
WHERE employee_id IN (SELECT id FROM employees WHERE name = '최형호' OR employee_id = 'MASLABS-004')
  AND start_date = '2025-12-22'
  AND end_date = '2025-12-24'
  AND leave_type = 'monthly';

-- 5. 최형호의 12월 월차 신청 등록 (이미 사용한 월차) - 중복 방지
INSERT INTO leave_requests (
    employee_id,
    start_date,
    end_date,
    reason,
    leave_type,
    is_monthly_leave,
    status,
    leave_days,
    created_at
)
SELECT 
    id,
    '2025-12-22',
    '2025-12-24',
    '베트남 휴가',
    'monthly', -- 월차로 등록
    true, -- 월차 플래그
    'approved', -- 이미 사용했으므로 승인 상태로
    3, -- 3일
    CURRENT_TIMESTAMP
FROM employees 
WHERE (name = '최형호' OR employee_id = 'MASLABS-004')
  AND NOT EXISTS (
    SELECT 1 FROM leave_requests lr
    WHERE lr.employee_id = employees.id
      AND lr.start_date = '2025-12-22'
      AND lr.end_date = '2025-12-24'
      AND lr.leave_type = 'monthly'
  );

-- 6. 최종 확인 (모든 컬럼 명시적으로 표시)
SELECT 
    '최종 확인' as section,
    e.name as 직원명,
    e.employee_id as 직원번호,
    e.leave_anniversary_date as 연차기산일,
    COALESCE(lb.year::text, '없음') as 연도,
    COALESCE(lb.total_days::text, '0') as 총연차,
    COALESCE(lb.used_days::text, '0') as 사용연차,
    COALESCE(lb.remaining_days::text, '0') as 잔여연차,
    (SELECT COUNT(*)::text FROM leave_requests 
     WHERE employee_id = e.id 
     AND leave_type = 'monthly'
     AND start_date = '2025-12-22'
     AND end_date = '2025-12-24') as 월차신청건수
FROM employees e
LEFT JOIN leave_balance lb ON e.id = lb.employee_id AND lb.year = 2025
WHERE e.name = '최형호' OR e.employee_id = 'MASLABS-004';

