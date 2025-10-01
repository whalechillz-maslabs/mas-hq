// bank_accounts 테이블 생성 스크립트
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

    // 1. 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS bank_accounts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          bank_name VARCHAR(50) NOT NULL,
          account_number VARCHAR(50) NOT NULL,
          account_holder VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(employee_id)
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.error('❌ 테이블 생성 실패:', tableError);
      return;
    }
    
    console.log('✅ bank_accounts 테이블 생성 완료');

    // 2. 인덱스 생성
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_employee_id ON bank_accounts(employee_id);
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank_name ON bank_accounts(bank_name);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexSQL });
    
    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError);
    } else {
      console.log('✅ 인덱스 생성 완료');
    }

    // 3. RLS 정책 설정
    const rlsSQL = `
      ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
      
      -- 기존 정책 삭제 (있다면)
      DROP POLICY IF EXISTS "Admins can access all bank accounts" ON bank_accounts;
      DROP POLICY IF EXISTS "Employees can view own bank account" ON bank_accounts;
      DROP POLICY IF EXISTS "Employees can update own bank account" ON bank_accounts;
      DROP POLICY IF EXISTS "Employees can insert own bank account" ON bank_accounts;
      
      -- 새 정책 생성
      CREATE POLICY "Admins can access all bank accounts" ON bank_accounts
          FOR ALL USING (
              EXISTS (
                  SELECT 1 FROM employees 
                  WHERE employees.id = auth.uid() 
                  AND employees.role_id = 'admin'
              )
          );
      
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
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    
    if (rlsError) {
      console.error('❌ RLS 정책 설정 실패:', rlsError);
    } else {
      console.log('✅ RLS 정책 설정 완료');
    }

    // 4. 트리거 함수 생성
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_bank_accounts_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS trigger_update_bank_accounts_updated_at ON bank_accounts;
      
      CREATE TRIGGER trigger_update_bank_accounts_updated_at
          BEFORE UPDATE ON bank_accounts
          FOR EACH ROW
          EXECUTE FUNCTION update_bank_accounts_updated_at();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    
    if (triggerError) {
      console.error('❌ 트리거 생성 실패:', triggerError);
    } else {
      console.log('✅ 트리거 생성 완료');
    }

    console.log('🎉 bank_accounts 테이블 설정이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
createBankAccountsTable();
