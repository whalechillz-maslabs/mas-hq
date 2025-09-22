-- 근로계약서 관리 테이블 생성 스크립트

-- 1. contracts 테이블 생성
CREATE TABLE IF NOT EXISTS contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('part_time', 'full_time', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE,
    salary INTEGER NOT NULL,
    work_hours INTEGER NOT NULL DEFAULT 7,
    work_days INTEGER NOT NULL DEFAULT 5,
    work_time VARCHAR(20) DEFAULT '09:00-17:00',
    lunch_break INTEGER DEFAULT 1,
    meal_allowance INTEGER DEFAULT 0,
    includes_weekly_holiday BOOLEAN DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'signed', 'active', 'expired')),
    employee_signature TEXT,
    employer_signature TEXT,
    documents JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signed_at TIMESTAMP WITH TIME ZONE
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);

-- 3. RLS (Row Level Security) 정책 설정
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 계약서에 접근 가능
CREATE POLICY "Admins can access all contracts" ON contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.role_id = 'admin'
        )
    );

-- 직원은 자신의 계약서만 조회 가능
CREATE POLICY "Employees can view own contracts" ON contracts
    FOR SELECT USING (
        employee_id = auth.uid()
    );

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_contracts_updated_at();

-- 5. Supabase Storage 버킷 생성 (수동으로 실행 필요)
-- contract-signatures: 서명 파일 저장용
-- contract-documents: 서류 파일 저장용

-- 6. 초기 데이터 삽입 (최형호 계약서 예시)
INSERT INTO contracts (
    employee_id,
    contract_type,
    start_date,
    end_date,
    salary,
    work_hours,
    work_days,
    work_time,
    lunch_break,
    meal_allowance,
    includes_weekly_holiday,
    status
) VALUES (
    (SELECT id FROM employees WHERE name = '최형호' LIMIT 1),
    'part_time',
    '2024-01-01',
    NULL,
    12000,
    7,
    5,
    '09:00-17:00',
    1,
    140000,
    true,
    'active'
) ON CONFLICT DO NOTHING;

-- 7. 뷰 생성 (계약서와 직원 정보 조인)
CREATE OR REPLACE VIEW contracts_with_employees AS
SELECT 
    c.*,
    e.name as employee_name,
    e.employee_id as employee_code,
    e.employment_type,
    e.hire_date,
    e.phone,
    e.email
FROM contracts c
LEFT JOIN employees e ON c.employee_id = e.id;

-- 8. 함수 생성 (계약서 상태 자동 업데이트)
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 계약 종료일이 지난 경우 만료로 변경
    IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
        NEW.status = 'expired';
    END IF;
    
    -- 서명이 완료된 경우 활성으로 변경
    IF NEW.employee_signature IS NOT NULL AND NEW.employer_signature IS NOT NULL AND NEW.status = 'signed' THEN
        NEW.status = 'active';
        NEW.signed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_status
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_status();

-- 9. 통계 함수 생성
CREATE OR REPLACE FUNCTION get_contract_stats()
RETURNS TABLE (
    total_contracts BIGINT,
    active_contracts BIGINT,
    pending_signature BIGINT,
    expired_contracts BIGINT,
    part_time_contracts BIGINT,
    full_time_contracts BIGINT,
    annual_contracts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_contracts,
        COUNT(*) FILTER (WHERE status = 'active') as active_contracts,
        COUNT(*) FILTER (WHERE status = 'pending_signature') as pending_signature,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_contracts,
        COUNT(*) FILTER (WHERE contract_type = 'part_time') as part_time_contracts,
        COUNT(*) FILTER (WHERE contract_type = 'full_time') as full_time_contracts,
        COUNT(*) FILTER (WHERE contract_type = 'annual') as annual_contracts
    FROM contracts;
END;
$$ LANGUAGE plpgsql;

-- 10. 완료 메시지
SELECT '근로계약서 관리 테이블이 성공적으로 생성되었습니다.' as message;
