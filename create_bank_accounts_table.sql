-- 급여 계좌 정보 테이블 생성 스크립트

-- 1. bank_accounts 테이블 생성
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    bank_name VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id) -- 직원당 하나의 계좌만 등록 가능
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bank_accounts_employee_id ON bank_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_name ON bank_accounts(bank_name);

-- 3. RLS (Row Level Security) 정책 설정
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 계좌 정보에 접근 가능
CREATE POLICY "Admins can access all bank accounts" ON bank_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid() 
            AND employees.role_id = 'admin'
        )
    );

-- 직원은 자신의 계좌 정보만 조회/수정 가능
CREATE POLICY "Employees can view own bank account" ON bank_accounts
    FOR SELECT USING (
        employee_id = auth.uid()
    );

CREATE POLICY "Employees can update own bank account" ON bank_accounts
    FOR UPDATE USING (
        employee_id = auth.uid()
    );

CREATE POLICY "Employees can insert own bank account" ON bank_accounts
    FOR INSERT WITH CHECK (
        employee_id = auth.uid()
    );

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_accounts_updated_at();

-- 5. 기존 데이터 마이그레이션 (선택사항)
-- employees 테이블에 bank_account 정보가 있다면 마이그레이션
-- INSERT INTO bank_accounts (employee_id, bank_name, account_number, account_holder)
-- SELECT id, '기업은행', '165-043559-02-028', name
-- FROM employees 
-- WHERE id = 'e998a540-51bf-4380-bcb1-86fb36ec7eb8' -- 최형호 ID
-- ON CONFLICT (employee_id) DO NOTHING;
