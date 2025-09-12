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

async function updateHeoPayslipStatus() {
  try {
    console.log('🔧 허상원 정산서 상태 업데이트 시작');
    
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
    
    // 2. 허상원의 8월 정산서 조회
    const { data: payslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .eq('period', '2025-08');
    
    if (payslipError) {
      console.error('❌ 정산서 조회 실패:', payslipError);
      return;
    }
    
    if (payslips.length === 0) {
      console.log('❌ 8월 정산서를 찾을 수 없습니다.');
      return;
    }
    
    const payslip = payslips[0];
    console.log('📋 현재 정산서 상태:', payslip.status);
    
    // 3. 정산서 상태를 issued로 업데이트
    const { data: updatedPayslip, error: updateError } = await supabase
      .from('payslips')
      .update({
        status: 'issued',
        issued_at: new Date().toISOString()
      })
      .eq('id', payslip.id)
      .select();
    
    if (updateError) {
      console.error('❌ 정산서 상태 업데이트 실패:', updateError);
      return;
    }
    
    console.log('✅ 정산서 상태 업데이트 성공');
    console.log('  - 정산서 ID:', updatedPayslip[0].id);
    console.log('  - 새로운 상태:', updatedPayslip[0].status);
    console.log('  - 발급일:', updatedPayslip[0].issued_at);
    
    // 4. 업데이트된 정산서 확인
    const { data: finalPayslip, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('id', payslip.id)
      .single();
    
    if (finalError) {
      console.error('❌ 최종 정산서 조회 실패:', finalError);
      return;
    }
    
    console.log('📊 최종 정산서 정보:');
    console.log('  - 기간:', finalPayslip.period);
    console.log('  - 상태:', finalPayslip.status);
    console.log('  - 총 금액:', finalPayslip.net_salary?.toLocaleString(), '원');
    console.log('  - 근무시간:', finalPayslip.total_hours, '시간');
    console.log('  - 발급일:', finalPayslip.issued_at);
    
    console.log('🎉 허상원 정산서 상태 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateHeoPayslipStatus();
