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

async function updateChoiPayslipStatus() {
  try {
    console.log('🔧 최형호 정산서 지급완료 업데이트 시작');
    
    // 1. 최형호 직원 정보 조회
    const { data: choiEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();
    
    if (employeeError) {
      console.error('❌ 최형호 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    // 2. 최형호의 8월 정산서 조회
    const { data: payslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', choiEmployee.id)
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
    console.log('📋 현재 발행일:', payslip.issued_at);
    console.log('📋 현재 지급일:', payslip.paid_at);
    
    // 3. 정산서를 지급완료로 업데이트
    const currentDate = new Date();
    const issuedAt = new Date('2025-09-10T09:00:00.000Z').toISOString(); // 기존 발행일 유지
    const paidAt = new Date('2025-09-10T18:00:00.000Z').toISOString(); // 지급일을 발행일과 동일하게 설정
    
    const { data: updatedPayslip, error: updateError } = await supabase
      .from('payslips')
      .update({
        status: 'paid',
        paid_at: paidAt,
        updated_at: currentDate.toISOString()
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
    console.log('  - 발행일:', updatedPayslip[0].issued_at);
    console.log('  - 지급일:', updatedPayslip[0].paid_at);
    
    // 4. 업데이트된 정산서 확인
    const { data: finalPayslip, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('id', payslip.id)
      .single();
    
    if (finalError) {
      console.error('❌ 최종 확인 실패:', finalError);
      return;
    }
    
    console.log('\n📋 업데이트 완료된 정산서:');
    console.log(`  - 기간: ${finalPayslip.period}`);
    console.log(`  - 총 급여: ${finalPayslip.total_earnings?.toLocaleString()}원`);
    console.log(`  - 실수령액: ${finalPayslip.net_salary?.toLocaleString()}원`);
    console.log(`  - 상태: ${finalPayslip.status}`);
    console.log(`  - 발행일: ${finalPayslip.issued_at ? new Date(finalPayslip.issued_at).toLocaleDateString('ko-KR') : '없음'}`);
    console.log(`  - 지급일: ${finalPayslip.paid_at ? new Date(finalPayslip.paid_at).toLocaleDateString('ko-KR') : '없음'}`);
    
    console.log('\n🎉 최형호 정산서 지급완료 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateChoiPayslipStatus();
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

async function updateChoiPayslipStatus() {
  try {
    console.log('🔧 최형호 정산서 지급완료 업데이트 시작');
    
    // 1. 최형호 직원 정보 조회
    const { data: choiEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();
    
    if (employeeError) {
      console.error('❌ 최형호 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    // 2. 최형호의 8월 정산서 조회
    const { data: payslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', choiEmployee.id)
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
    console.log('📋 현재 발행일:', payslip.issued_at);
    console.log('📋 현재 지급일:', payslip.paid_at);
    
    // 3. 정산서를 지급완료로 업데이트
    const currentDate = new Date();
    const issuedAt = new Date('2025-09-10T09:00:00.000Z').toISOString(); // 기존 발행일 유지
    const paidAt = new Date('2025-09-10T18:00:00.000Z').toISOString(); // 지급일을 발행일과 동일하게 설정
    
    const { data: updatedPayslip, error: updateError } = await supabase
      .from('payslips')
      .update({
        status: 'paid',
        paid_at: paidAt,
        updated_at: currentDate.toISOString()
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
    console.log('  - 발행일:', updatedPayslip[0].issued_at);
    console.log('  - 지급일:', updatedPayslip[0].paid_at);
    
    // 4. 업데이트된 정산서 확인
    const { data: finalPayslip, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('id', payslip.id)
      .single();
    
    if (finalError) {
      console.error('❌ 최종 확인 실패:', finalError);
      return;
    }
    
    console.log('\n📋 업데이트 완료된 정산서:');
    console.log(`  - 기간: ${finalPayslip.period}`);
    console.log(`  - 총 급여: ${finalPayslip.total_earnings?.toLocaleString()}원`);
    console.log(`  - 실수령액: ${finalPayslip.net_salary?.toLocaleString()}원`);
    console.log(`  - 상태: ${finalPayslip.status}`);
    console.log(`  - 발행일: ${finalPayslip.issued_at ? new Date(finalPayslip.issued_at).toLocaleDateString('ko-KR') : '없음'}`);
    console.log(`  - 지급일: ${finalPayslip.paid_at ? new Date(finalPayslip.paid_at).toLocaleDateString('ko-KR') : '없음'}`);
    
    console.log('\n🎉 최형호 정산서 지급완료 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateChoiPayslipStatus();
