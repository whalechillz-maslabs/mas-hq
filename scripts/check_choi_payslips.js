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

async function checkChoiPayslips() {
  try {
    console.log('📋 최형호 정산서 조회 시작');
    
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
    
    console.log('👤 최형호 직원 정보:', {
      id: choiEmployee.id,
      name: choiEmployee.name,
      email: choiEmployee.email
    });
    
    // 2. 최형호의 모든 정산서 조회
    const { data: allPayslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .order('period', { ascending: true });
    
    if (payslipError) {
      console.error('❌ 정산서 조회 실패:', payslipError);
      return;
    }
    
    console.log(`\n📊 최형호 정산서 총 ${allPayslips.length}개:`);
    
    if (allPayslips.length === 0) {
      console.log('❌ 정산서가 없습니다.');
      return;
    }
    
    allPayslips.forEach((payslip, index) => {
      const issuedDate = payslip.issued_at ? new Date(payslip.issued_at).toLocaleDateString('ko-KR') : '없음';
      const paidDate = payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '없음';
      
      console.log(`\n  ${index + 1}. ${payslip.period}`);
      console.log(`     - 고용형태: ${payslip.employment_type}`);
      console.log(`     - 총 급여: ${payslip.total_earnings?.toLocaleString()}원`);
      console.log(`     - 실수령액: ${payslip.net_salary?.toLocaleString()}원`);
      console.log(`     - 근무시간: ${payslip.total_hours}시간`);
      console.log(`     - 시급: ${payslip.hourly_rate?.toLocaleString()}원`);
      console.log(`     - 상태: ${payslip.status}`);
      console.log(`     - 발행일: ${issuedDate}`);
      console.log(`     - 지급일: ${paidDate}`);
    });
    
    // 3. 지급완료가 아닌 정산서 확인
    const unpaidPayslips = allPayslips.filter(p => p.status !== 'paid');
    
    if (unpaidPayslips.length > 0) {
      console.log(`\n⚠️ 지급완료가 아닌 정산서 ${unpaidPayslips.length}개:`);
      unpaidPayslips.forEach(payslip => {
        console.log(`  - ${payslip.period}: ${payslip.status}`);
      });
    } else {
      console.log('\n✅ 모든 정산서가 지급완료 상태입니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkChoiPayslips();
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

async function checkChoiPayslips() {
  try {
    console.log('📋 최형호 정산서 조회 시작');
    
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
    
    console.log('👤 최형호 직원 정보:', {
      id: choiEmployee.id,
      name: choiEmployee.name,
      email: choiEmployee.email
    });
    
    // 2. 최형호의 모든 정산서 조회
    const { data: allPayslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .order('period', { ascending: true });
    
    if (payslipError) {
      console.error('❌ 정산서 조회 실패:', payslipError);
      return;
    }
    
    console.log(`\n📊 최형호 정산서 총 ${allPayslips.length}개:`);
    
    if (allPayslips.length === 0) {
      console.log('❌ 정산서가 없습니다.');
      return;
    }
    
    allPayslips.forEach((payslip, index) => {
      const issuedDate = payslip.issued_at ? new Date(payslip.issued_at).toLocaleDateString('ko-KR') : '없음';
      const paidDate = payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '없음';
      
      console.log(`\n  ${index + 1}. ${payslip.period}`);
      console.log(`     - 고용형태: ${payslip.employment_type}`);
      console.log(`     - 총 급여: ${payslip.total_earnings?.toLocaleString()}원`);
      console.log(`     - 실수령액: ${payslip.net_salary?.toLocaleString()}원`);
      console.log(`     - 근무시간: ${payslip.total_hours}시간`);
      console.log(`     - 시급: ${payslip.hourly_rate?.toLocaleString()}원`);
      console.log(`     - 상태: ${payslip.status}`);
      console.log(`     - 발행일: ${issuedDate}`);
      console.log(`     - 지급일: ${paidDate}`);
    });
    
    // 3. 지급완료가 아닌 정산서 확인
    const unpaidPayslips = allPayslips.filter(p => p.status !== 'paid');
    
    if (unpaidPayslips.length > 0) {
      console.log(`\n⚠️ 지급완료가 아닌 정산서 ${unpaidPayslips.length}개:`);
      unpaidPayslips.forEach(payslip => {
        console.log(`  - ${payslip.period}: ${payslip.status}`);
      });
    } else {
      console.log('\n✅ 모든 정산서가 지급완료 상태입니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkChoiPayslips();
