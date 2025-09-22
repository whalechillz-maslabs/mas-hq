-- 연차 기산일 필드 추가 스크립트

-- 1. leave_balance 테이블에 연차 기산일 필드 추가
ALTER TABLE leave_balance 
ADD COLUMN IF NOT EXISTS leave_anniversary_date DATE;

-- 2. employees 테이블에 연차 기산일 필드 추가 (선택사항)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS leave_anniversary_date DATE;

-- 3. 기존 데이터 업데이트 (입사일을 연차 기산일로 설정)
UPDATE leave_balance 
SET leave_anniversary_date = (
    SELECT e.hire_date 
    FROM employees e 
    WHERE e.id = leave_balance.employee_id
)
WHERE leave_anniversary_date IS NULL;

UPDATE employees 
SET leave_anniversary_date = hire_date 
WHERE leave_anniversary_date IS NULL;

-- 4. 연차 기산일 기준으로 연차 일수 재계산하는 함수
CREATE OR REPLACE FUNCTION calculate_leave_days_by_anniversary(
    anniversary_date DATE,
    target_year INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    current_year INTEGER;
    years_worked INTEGER;
BEGIN
    -- 현재 연도 또는 지정된 연도 사용
    IF target_year IS NULL THEN
        current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    ELSE
        current_year := target_year;
    END IF;
    
    -- 연차 기산일로부터 경과한 연수 계산
    years_worked := current_year - EXTRACT(YEAR FROM anniversary_date);
    
    -- 연차 일수 반환
    IF years_worked < 1 THEN
        RETURN 0;
    ELSIF years_worked < 2 THEN
        RETURN 11;
    ELSIF years_worked < 3 THEN
        RETURN 12;
    ELSIF years_worked < 4 THEN
        RETURN 14;
    ELSIF years_worked < 5 THEN
        RETURN 15;
    ELSIF years_worked < 6 THEN
        RETURN 16;
    ELSE
        RETURN 20;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 연차 기산일 업데이트 함수
CREATE OR REPLACE FUNCTION update_leave_anniversary(
    emp_id UUID,
    new_anniversary_date DATE
) RETURNS VOID AS $$
DECLARE
    current_year INTEGER;
    calculated_days INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- 직원의 연차 기산일 업데이트
    UPDATE employees 
    SET leave_anniversary_date = new_anniversary_date 
    WHERE id = emp_id;
    
    -- 해당 연도의 연차 일수 재계산
    calculated_days := calculate_leave_days_by_anniversary(new_anniversary_date, current_year);
    
    -- 연차 잔여일 업데이트 (기존 데이터가 있으면 업데이트, 없으면 생성)
    INSERT INTO leave_balance (employee_id, year, total_days, used_days, leave_anniversary_date)
    VALUES (emp_id, current_year, calculated_days, 0, new_anniversary_date)
    ON CONFLICT (employee_id, year) 
    DO UPDATE SET 
        total_days = calculated_days,
        leave_anniversary_date = new_anniversary_date,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 6. 모든 직원의 연차 기산일을 입사일로 초기화
UPDATE employees 
SET leave_anniversary_date = hire_date 
WHERE leave_anniversary_date IS NULL;

-- 7. 기존 연차 데이터에 연차 기산일 추가
UPDATE leave_balance 
SET leave_anniversary_date = (
    SELECT e.leave_anniversary_date 
    FROM employees e 
    WHERE e.id = leave_balance.employee_id
)
WHERE leave_anniversary_date IS NULL;

-- 8. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_leave_balance_anniversary ON leave_balance(leave_anniversary_date);
CREATE INDEX IF NOT EXISTS idx_employees_anniversary ON employees(leave_anniversary_date);

-- 9. 댓글 추가
COMMENT ON COLUMN leave_balance.leave_anniversary_date IS '연차 기산일 (연차 계산 기준일)';
COMMENT ON COLUMN employees.leave_anniversary_date IS '연차 기산일 (알바→정직원 전환 시 변경 가능)';
COMMENT ON FUNCTION calculate_leave_days_by_anniversary IS '연차 기산일 기준으로 연차 일수 계산';
COMMENT ON FUNCTION update_leave_anniversary IS '직원의 연차 기산일 업데이트 및 연차 재계산';
