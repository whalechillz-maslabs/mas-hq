-- employee_tasks 테이블의 achievement_status 제약 조건 수정
-- 기존 제약 조건 삭제
ALTER TABLE employee_tasks DROP CONSTRAINT IF EXISTS employee_tasks_achievement_status_check;

-- 새로운 제약 조건 추가 (refunded 포함)
ALTER TABLE employee_tasks ADD CONSTRAINT employee_tasks_achievement_status_check 
CHECK (achievement_status IN ('pending', 'completed', 'refunded'));

-- 제약 조건 확인
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'employee_tasks_achievement_status_check';
