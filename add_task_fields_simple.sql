-- employee_tasks 테이블 심플한 필드 추가

-- 1. 업무 수행 시각 (30분 단위)
ALTER TABLE employee_tasks 
ADD COLUMN task_time TIME;

-- 2. 고객명 (VIP0000 표기)
ALTER TABLE employee_tasks 
ADD COLUMN customer_name VARCHAR(100);

-- 3. 매출 금액 (판매 시에만)
ALTER TABLE employee_tasks 
ADD COLUMN sales_amount DECIMAL(12,2) DEFAULT 0;

-- 4. 업무 수행자 (실제 직원 연결)
ALTER TABLE employee_tasks 
ADD COLUMN performer_id UUID REFERENCES employees(id);

-- 5. 달성여부 (대기, 완료)
ALTER TABLE employee_tasks 
ADD COLUMN achievement_status VARCHAR(20) DEFAULT 'pending' CHECK (achievement_status IN ('pending', 'completed'));

-- 6. 업무 우선순위
ALTER TABLE employee_tasks 
ADD COLUMN task_priority VARCHAR(20) DEFAULT 'normal' CHECK (task_priority IN ('low', 'normal', 'high', 'urgent'));

-- 7. 업무명 (기존 title 필드 활용)
-- 기존 title 필드가 있으므로 그대로 사용

-- 8. 설명 (업무 내용 설명) - 기존 notes 필드 활용
-- 기존 notes 필드가 있으므로 그대로 사용

-- 기존 필드들 정리
-- quantity, memo 필드는 삭제하지 않고 기존 notes 필드를 설명으로 활용

-- 기본값 설정
UPDATE employee_tasks 
SET 
    achievement_status = 'pending',
    task_priority = 'normal',
    sales_amount = 0
WHERE achievement_status IS NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_employee_tasks_customer_name ON employee_tasks(customer_name);
CREATE INDEX idx_employee_tasks_task_time ON employee_tasks(task_time);
CREATE INDEX idx_employee_tasks_sales_amount ON employee_tasks(sales_amount);
CREATE INDEX idx_employee_tasks_achievement_status ON employee_tasks(achievement_status);
CREATE INDEX idx_employee_tasks_performer_id ON employee_tasks(performer_id);

-- 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'employee_tasks' 
ORDER BY ordinal_position;
