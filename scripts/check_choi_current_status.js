const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChoiCurrentStatus() {
  try {
    console.log('=== 최형호 현재 상태 확인 ===\n');

    // 1. 최형호 직원 정보 조회
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();

    if (empError) {
      console.error('❌ 최형호 정보 조회 실패:', empError);
      return;
    }

    console.log('👤 최형호 현재 정보:');
    console.log(`• 이름: ${choiEmployee.name}`);
    console.log(`• 직원코드: ${choiEmployee.employee_id}`);
    console.log(`• 고용형태: ${choiEmployee.employment_type}`);
    console.log(`• 월급: ${choiEmployee.monthly_salary || '없음'}`);
    console.log(`• 시급: ${choiEmployee.hourly_rate || '없음'}`);
    console.log(`• 입사일: ${choiEmployee.hire_date}`);
    console.log(`• 수정일: ${choiEmployee.updated_at}\n`);

    // 2. 최형호의 8월 급여명세서 확인
    console.log('📊 최형호 8월 급여명세서:');
    const { data: augustPayslip, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('period', '2025-08')
      .single();

    if (payslipError) {
      console.log('• 8월 급여명세서: 없음');
    } else {
      console.log(`• 8월 급여명세서: ${augustPayslip.employment_type} - ${augustPayslip.total_earnings}원`);
    }

    // 3. 최형호의 9월 급여명세서 확인
    console.log('\n📊 최형호 9월 급여명세서:');
    const { data: septemberPayslip, error: septPayslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('period', '2025-09')
      .single();

    if (septPayslipError) {
      console.log('• 9월 급여명세서: 없음');
    } else {
      console.log(`• 9월 급여명세서: ${septemberPayslip.employment_type} - ${septemberPayslip.total_earnings}원`);
    }

    // 4. 문제 분석
    console.log('\n🔍 문제 분석:');
    if (choiEmployee.employment_type === 'full_time') {
      console.log('❌ 문제: 현재 고용형태가 full_time으로 설정되어 있음');
      console.log('   → 8월은 part_time이어야 함');
      console.log('   → 9월부터 full_time이어야 함');
      console.log('\n💡 해결방안:');
      console.log('   1. 현재 고용형태를 part_time으로 변경 (8월 기준)');
      console.log('   2. 급여 조회 페이지에서 날짜별 고용형태를 구분하여 표시');
      console.log('   3. 또는 급여 조회 페이지에서 기간별 급여명세서를 조회하여 표시');
    } else {
      console.log('✅ 현재 고용형태가 part_time으로 설정되어 있음');
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkChoiCurrentStatus();
