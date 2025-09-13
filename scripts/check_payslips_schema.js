const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPayslipsSchema() {
  try {
    console.log('🔍 payslips 테이블 스키마 확인');
    
    // payslips 테이블의 컬럼 정보 조회
    const { data, error } = await supabase
      .from('payslips')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ payslips 테이블 조회 실패:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📊 payslips 테이블 컬럼:');
      Object.keys(data[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof data[0][column]}`);
      });
    } else {
      console.log('📊 payslips 테이블이 비어있습니다.');
    }
    
    // 실제 데이터 조회
    const { data: payslips, error: payslipsError } = await supabase
      .from('payslips')
      .select('*')
      .limit(5);
    
    if (payslipsError) {
      console.error('❌ payslips 데이터 조회 실패:', payslipsError);
      return;
    }
    
    console.log(`\n📋 payslips 데이터 ${payslips.length}개:`);
    payslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ID: ${payslip.id}, 직원ID: ${payslip.employee_id}, 기간: ${payslip.period}`);
    });
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkPayslipsSchema();
