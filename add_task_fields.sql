-- employee_tasks 테이블에 실제 업무 데이터에 필요한 필드들 추가

-- 1. 시간 필드 추가 (30분 단위)
ALTER TABLE employee_tasks 
ADD COLUMN task_time TIME;

-- 2. 고객명 필드 추가 (VIP0000 표기)
ALTER TABLE employee_tasks 
ADD COLUMN customer_name VARCHAR(100);

-- 3. 매출금액 필드 추가 (판매 시에만)
ALTER TABLE employee_tasks 
ADD COLUMN sales_amount DECIMAL(12,2) DEFAULT 0;

-- 4. 비고/상세내용 필드 추가 (기존 notes 필드와 구분)
ALTER TABLE employee_tasks 
ADD COLUMN detailed_notes TEXT;

-- 5. 달성여부 필드 추가 (대기중/완료 구분)
ALTER TABLE employee_tasks 
ADD COLUMN achievement_status VARCHAR(20) DEFAULT 'pending' CHECK (achievement_status IN ('pending', 'completed', 'failed'));

-- 6. 업무수행자 필드 추가 (기존 employee_id와 구분하여 실제 수행자)
ALTER TABLE employee_tasks 
ADD COLUMN performer_id UUID REFERENCES employees(id);

-- 7. 업무 시작 시간 필드 추가 (정확한 시간 기록)
ALTER TABLE employee_tasks 
ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;

-- 8. 업무 종료 시간 필드 추가
ALTER TABLE employee_tasks 
ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;

-- 9. 업무 지속 시간 필드 추가 (분 단위)
ALTER TABLE employee_tasks 
ADD COLUMN duration_minutes INTEGER;

-- 10. 고객 연락처 필드 추가
ALTER TABLE employee_tasks 
ADD COLUMN customer_contact VARCHAR(50);

-- 11. 업무 우선순위 필드 추가 (기존 priority와 구분)
ALTER TABLE employee_tasks 
ADD COLUMN task_priority VARCHAR(20) DEFAULT 'normal' CHECK (task_priority IN ('low', 'normal', 'high', 'urgent'));

-- 12. 업무 카테고리 필드 추가 (OP 코드와 구분)
ALTER TABLE employee_tasks 
ADD COLUMN task_category VARCHAR(50);

-- 13. 매출 발생 여부 필드 추가
ALTER TABLE employee_tasks 
ADD COLUMN has_sales BOOLEAN DEFAULT FALSE;

-- 14. 고객 등급 필드 추가 (VIP 등급)
ALTER TABLE employee_tasks 
ADD COLUMN customer_grade VARCHAR(20) DEFAULT 'regular';

-- 15. 업무 완료 확인자 필드 추가
ALTER TABLE employee_tasks 
ADD COLUMN verified_by UUID REFERENCES employees(id);

-- 16. 업무 완료 확인 시간 필드 추가
ALTER TABLE employee_tasks 
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;

-- 기존 필드들의 제약조건 확인 및 수정
-- status 필드에 'verified' 상태 추가
ALTER TABLE employee_tasks 
DROP CONSTRAINT IF EXISTS employee_tasks_status_check;

ALTER TABLE employee_tasks 
ADD CONSTRAINT employee_tasks_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'verified', 'cancelled'));

-- 기본값 설정
UPDATE employee_tasks 
SET 
    achievement_status = 'pending',
    task_priority = 'normal',
    has_sales = FALSE,
    customer_grade = 'regular'
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
