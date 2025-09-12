const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    // 따옴표와 개행 문자 제거
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
  }
});

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeoPayslips() {
  try {
    console.log('🔍 허상원 정산서 확인 시작');
    
    // 1. 허상원 직원 정보 조회
    const { data: heoEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    if (employeeError) {
      console.error('❌ 허상원 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    // 2. 허상원의 모든 정산서 조회
    const { data: payslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('created_at', { ascending: false });
    
    if (payslipError) {
      console.error('❌ 정산서 조회 실패:', payslipError);
      return;
    }
    
    console.log('📋 허상원 정산서 목록:');
    payslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.status})`);
      console.log(`     - ID: ${payslip.id}`);
      console.log(`     - 근무시간: ${payslip.total_hours}시간`);
      console.log(`     - 시급: ${payslip.hourly_rate?.toLocaleString()}원`);
      console.log(`     - 발급일: ${payslip.issued_at || payslip.created_at}`);
      console.log('');
    });
    
    // 3. 8월 정산서 상세 확인
    const augustPayslip = payslips.find(p => p.period === '2025-08');
    if (augustPayslip) {
      console.log('📊 8월 정산서 상세:');
      console.log('  - 총 근무시간:', augustPayslip.total_hours, '시간');
      console.log('  - 총 금액:', augustPayslip.net_salary?.toLocaleString(), '원');
      console.log('  - 상태:', augustPayslip.status);
      console.log('  - 일별 내역 수:', augustPayslip.daily_details?.length || 0, '일');
      
      if (augustPayslip.daily_details && augustPayslip.daily_details.length > 0) {
        console.log('  - 일별 내역 (처음 5일):');
        augustPayslip.daily_details.slice(0, 5).forEach((detail, index) => {
          console.log(`    ${index + 1}. ${detail.date}: ${detail.hours}시간 × ${detail.hourly_wage?.toLocaleString()}원 = ${detail.daily_wage?.toLocaleString()}원`);
        });
      }
    }
    
    console.log('✅ 허상원 정산서 확인 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkHeoPayslips();
