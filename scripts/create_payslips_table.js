const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createPayslipsTable() {
  try {
    console.log('=== payslips 테이블 생성 시작 ===');
    
    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('scripts/create_payslips_table.sql', 'utf8');
    
    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('payslips 테이블 생성 실패:', error);
      
      // 대안: 직접 테이블 생성 시도
      console.log('\n대안 방법으로 테이블 생성 시도...');
      await createTableDirectly();
      return;
    }
    
    console.log('✅ payslips 테이블 생성 완료');
    console.log('결과:', data);
    
  } catch (error) {
    console.error('오류 발생:', error);
    console.log('\n대안 방법으로 테이블 생성 시도...');
    await createTableDirectly();
  }
}

async function createTableDirectly() {
  try {
    console.log('=== 직접 테이블 생성 시도 ===');
    
    // 기본 테이블 생성
    const { error: createError } = await supabase
      .from('payslips')
      .select('*')
      .limit(1);
    
    if (createError && createError.message.includes('relation "payslips" does not exist')) {
      console.log('payslips 테이블이 존재하지 않습니다. 수동으로 생성해야 합니다.');
      console.log('\n📋 Supabase 대시보드에서 다음 SQL을 실행하세요:');
      console.log('─'.repeat(80));
      
      const sqlContent = fs.readFileSync('scripts/create_payslips_table.sql', 'utf8');
      console.log(sqlContent);
      console.log('─'.repeat(80));
      
    } else if (createError) {
      console.error('테이블 확인 중 오류:', createError);
    } else {
      console.log('✅ payslips 테이블이 이미 존재합니다.');
    }
    
  } catch (error) {
    console.error('직접 테이블 생성 시도 중 오류:', error);
  }
}

createPayslipsTable();

