// bank_accounts 테이블 생성 스크립트 (간단한 방법)
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// 환경 변수 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBankAccountsTable() {
  try {
    console.log('🚀 bank_accounts 테이블 생성을 시작합니다...');

    // 테이블이 이미 존재하는지 확인
    const { data: existingTable, error: checkError } = await supabase
      .from('bank_accounts')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      console.log('📋 bank_accounts 테이블이 존재하지 않습니다. 수동으로 생성해야 합니다.');
      console.log('');
      console.log('🔧 다음 단계를 따라주세요:');
      console.log('');
      console.log('1. Supabase 대시보드에 접속: https://supabase.com/dashboard');
      console.log('2. 프로젝트 선택');
      console.log('3. SQL Editor 클릭');
      console.log('4. 아래 SQL을 복사해서 실행:');
      console.log('');
      console.log('-- bank_accounts 테이블 생성');
      console.log('CREATE TABLE IF NOT EXISTS bank_accounts (');
      console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
      console.log('    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,');
      console.log('    bank_name VARCHAR(50) NOT NULL,');
      console.log('    account_number VARCHAR(50) NOT NULL,');
      console.log('    account_holder VARCHAR(100) NOT NULL,');
      console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('    UNIQUE(employee_id)');
      console.log(');');
      console.log('');
      console.log('-- 인덱스 생성');
      console.log('CREATE INDEX IF NOT EXISTS idx_bank_accounts_employee_id ON bank_accounts(employee_id);');
      console.log('');
      console.log('-- RLS 활성화');
      console.log('ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- RLS 정책 생성');
      console.log('CREATE POLICY "Admins can access all bank accounts" ON bank_accounts');
      console.log('    FOR ALL USING (');
      console.log('        EXISTS (');
      console.log('            SELECT 1 FROM employees');
      console.log('            WHERE employees.id = auth.uid()');
      console.log('            AND employees.role_id = \'admin\'');
      console.log('        )');
      console.log('    );');
      console.log('');
      console.log('CREATE POLICY "Employees can view own bank account" ON bank_accounts');
      console.log('    FOR SELECT USING (employee_id = auth.uid());');
      console.log('');
      console.log('CREATE POLICY "Employees can update own bank account" ON bank_accounts');
      console.log('    FOR UPDATE USING (employee_id = auth.uid());');
      console.log('');
      console.log('CREATE POLICY "Employees can insert own bank account" ON bank_accounts');
      console.log('    FOR INSERT WITH CHECK (employee_id = auth.uid());');
      console.log('');
      console.log('-- 트리거 함수 생성');
      console.log('CREATE OR REPLACE FUNCTION update_bank_accounts_updated_at()');
      console.log('RETURNS TRIGGER AS $$');
      console.log('BEGIN');
      console.log('    NEW.updated_at = NOW();');
      console.log('    RETURN NEW;');
      console.log('END;');
      console.log('$$ LANGUAGE plpgsql;');
      console.log('');
      console.log('CREATE TRIGGER trigger_update_bank_accounts_updated_at');
      console.log('    BEFORE UPDATE ON bank_accounts');
      console.log('    FOR EACH ROW');
      console.log('    EXECUTE FUNCTION update_bank_accounts_updated_at();');
      console.log('');
      console.log('5. SQL 실행 후 이 스크립트를 다시 실행하여 확인');
      
    } else if (checkError) {
      console.error('❌ 테이블 확인 중 오류:', checkError);
    } else {
      console.log('✅ bank_accounts 테이블이 이미 존재합니다!');
      console.log('📊 테이블 정보:', existingTable);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
createBankAccountsTable();
