const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEmployeeBreaksTable() {
  console.log('🔧 employee_breaks 테이블 생성 시작...\n');

  try {
    // 1. 테이블 존재 여부 확인
    console.log('1️⃣ 기존 테이블 확인...');
    try {
      const { data, error } = await supabase
        .from('employee_breaks')
        .select('*')
        .limit(1);

      if (error && error.message.includes('Could not find the table')) {
        console.log('❌ employee_breaks 테이블이 존재하지 않습니다.');
      } else {
        console.log('✅ employee_breaks 테이블이 이미 존재합니다.');
        return;
      }
    } catch (err) {
      console.log('❌ employee_breaks 테이블 확인 실패:', err.message);
    }

    // 2. SQL을 직접 실행하여 테이블 생성
    console.log('\n2️⃣ employee_breaks 테이블 생성...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS employee_breaks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        break_type VARCHAR(20) NOT NULL DEFAULT 'lunch', -- 'lunch', 'coffee', 'personal', 'other'
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        duration_minutes INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(employee_id, date, break_type, start_time)
      );
    `;

    console.log('📋 employee_breaks 테이블 생성 SQL:');
    console.log(createTableSQL);

    // 3. RLS (Row Level Security) 정책 추가
    const rlsPolicySQL = `
      -- RLS 활성화
      ALTER TABLE employee_breaks ENABLE ROW LEVEL SECURITY;
      
      -- 모든 사용자가 읽기 가능
      CREATE POLICY "employee_breaks_select_policy" ON employee_breaks
        FOR SELECT USING (true);
      
      -- 인증된 사용자가 삽입 가능
      CREATE POLICY "employee_breaks_insert_policy" ON employee_breaks
        FOR INSERT WITH CHECK (true);
      
      -- 인증된 사용자가 업데이트 가능
      CREATE POLICY "employee_breaks_update_policy" ON employee_breaks
        FOR UPDATE USING (true);
      
      -- 인증된 사용자가 삭제 가능
      CREATE POLICY "employee_breaks_delete_policy" ON employee_breaks
        FOR DELETE USING (true);
    `;

    console.log('\n📋 RLS 정책 SQL:');
    console.log(rlsPolicySQL);

    // 4. 인덱스 생성
    const indexSQL = `
      -- 성능을 위한 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_employee_breaks_employee_date ON employee_breaks(employee_id, date);
      CREATE INDEX IF NOT EXISTS idx_employee_breaks_date ON employee_breaks(date);
      CREATE INDEX IF NOT EXISTS idx_employee_breaks_type ON employee_breaks(break_type);
      CREATE INDEX IF NOT EXISTS idx_employee_breaks_employee_date_type ON employee_breaks(employee_id, date, break_type);
    `;

    console.log('\n📋 인덱스 생성 SQL:');
    console.log(indexSQL);

    // 5. 테이블 생성 실행 (Supabase Dashboard에서 수동 실행 필요)
    console.log('\n🚀 실행 방법:');
    console.log('1. Supabase Dashboard → SQL Editor로 이동');
    console.log('2. 아래 SQL을 복사하여 실행:');
    console.log('\n' + '='.repeat(80));
    console.log(createTableSQL);
    console.log('\n' + rlsPolicySQL);
    console.log('\n' + indexSQL);
    console.log('='.repeat(80));

    // 6. 테이블 생성 후 확인
    console.log('\n3️⃣ 테이블 생성 확인...');
    console.log('테이블 생성 후 다음 명령어로 확인하세요:');
    console.log('node scripts/verify_employee_breaks_table.js');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createEmployeeBreaksTable();
