-- payslips 테이블 생성
CREATE TABLE IF NOT EXISTS payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL, -- 예: '2025-08'
    employment_type VARCHAR(20) NOT NULL, -- 'full_time' 또는 'part_time'
    
    -- 급여 정보
    base_salary INTEGER NOT NULL DEFAULT 0,
    overtime_pay INTEGER NOT NULL DEFAULT 0,
    incentive INTEGER NOT NULL DEFAULT 0,
    point_bonus INTEGER NOT NULL DEFAULT 0,
    total_earnings INTEGER NOT NULL DEFAULT 0,
    tax_amount INTEGER NOT NULL DEFAULT 0,
    net_salary INTEGER NOT NULL DEFAULT 0,
    
    -- 시간제 급여 관련 (part_time인 경우)
    total_hours DECIMAL(4,1), -- 총 근무시간
    hourly_rate INTEGER, -- 시급
    
    -- 상세 내역 (JSON 형태로 저장)
    daily_details JSONB, -- 일별 상세 내역
    
    -- 상태 및 메타데이터
    status VARCHAR(20) NOT NULL DEFAULT 'generated', -- 'generated', 'issued', 'paid'
    issued_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 생성/수정 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT payslips_employee_period_unique UNIQUE(employee_id, period)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);
CREATE INDEX IF NOT EXISTS idx_payslips_created_at ON payslips(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "Enable all operations for all users" ON payslips
    FOR ALL USING (true);

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_payslips_updated_at 
    BEFORE UPDATE ON payslips 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 테이블 생성 완료 메시지
SELECT 'payslips 테이블이 성공적으로 생성되었습니다.' as message;
