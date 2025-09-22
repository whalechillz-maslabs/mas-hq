-- 연차 관리 시스템 테이블 생성

-- 1. 연차 잔여 테이블
CREATE TABLE IF NOT EXISTS leave_balance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_days DECIMAL(4,1) NOT NULL DEFAULT 11, -- 총 연차 (기본 11일)
    used_days DECIMAL(4,1) DEFAULT 0, -- 사용 연차
    remaining_days DECIMAL(4,1) GENERATED ALWAYS AS (total_days - used_days) STORED, -- 잔여 연차
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, year)
);

-- 2. 연차 신청 테이블
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_leave_balance_employee_year ON leave_balance(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "관리자는 모든 연차 잔여 데이터 접근 가능" ON leave_balance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.role_id = 'admin'
        )
    );

CREATE POLICY "관리자는 모든 연차 신청 데이터 접근 가능" ON leave_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.role_id = 'admin'
        )
    );

-- 직원은 본인 데이터만 접근 가능
CREATE POLICY "직원은 본인 연차 잔여 데이터만 접근 가능" ON leave_balance
    FOR ALL USING (employee_id = auth.uid());

CREATE POLICY "직원은 본인 연차 신청 데이터만 접근 가능" ON leave_requests
    FOR ALL USING (employee_id = auth.uid());

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_leave_balance_updated_at 
    BEFORE UPDATE ON leave_balance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at 
    BEFORE UPDATE ON leave_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2025년 연차 잔여일 초기 데이터 삽입 (기존 직원들)
INSERT INTO leave_balance (employee_id, year, total_days, used_days)
SELECT 
    id,
    2025,
    11, -- 기본 연차 11일
    0   -- 사용 연차 0일
FROM employees 
WHERE status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM leave_balance 
    WHERE leave_balance.employee_id = employees.id 
    AND leave_balance.year = 2025
);

-- 성공 메시지
SELECT '연차 관리 시스템 테이블이 성공적으로 생성되었습니다.' as message;
