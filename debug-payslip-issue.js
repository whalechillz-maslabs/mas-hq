const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjczNiwiZXhwIjoyMDcwNDgyNzM2fQ.EKXlFrz2tLsAa-B4h-OGct2O1zODSMGuGp8nMZta4go'
);

async function debugPayslipIssue() {
  console.log('=== 급여명세서 발행 오류 디버깅 ===');
  
  // 최형호 직원 ID 조회
  const { data: employee } = await supabase
    .from('employees')
    .select('id, name')
    .eq('name', '최형호')
    .single();
    
  if (!employee) {
    console.log('최형호 직원을 찾을 수 없습니다.');
    return;
  }
  
  console.log('직원:', employee.name, employee.id);
  
  // 8월 급여명세서 조회
  const { data: payslip, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('period', '2025-08')
    .single();
    
  if (error) {
    console.log('급여명세서 조회 오류:', error);
    return;
  }
  
  if (!payslip) {
    console.log('8월 급여명세서가 없습니다.');
    return;
  }
  
  console.log('=== 급여명세서 데이터 ===');
  console.log('ID:', payslip.id);
  console.log('Period:', payslip.period);
  console.log('Status:', payslip.status);
  console.log('Employee ID:', payslip.employee_id);
  console.log('Base Salary:', payslip.base_salary);
  console.log('Weekly Holiday Pay:', payslip.weekly_holiday_pay);
  console.log('Meal Allowance:', payslip.meal_allowance);
  
  // 발행 시도 시뮬레이션
  console.log('\n=== 발행 시도 시뮬레이션 ===');
  
  try {
    // 기존 레코드 확인
    const { data: existingPayslip, error: checkError } = await supabase
      .from('payslips')
      .select('id')
      .eq('employee_id', payslip.employee_id)
      .eq('period', payslip.period)
      .single();
      
    console.log('기존 레코드 확인 결과:');
    console.log('Existing Payslip:', existingPayslip);
    console.log('Check Error:', checkError);
    
    if (existingPayslip) {
      console.log('기존 레코드가 있으므로 업데이트 시도...');
      
      const { error: updateError } = await supabase
        .from('payslips')
        .update({ 
          status: 'issued',
          issued_at: new Date().toISOString()
        })
        .eq('id', existingPayslip.id);
        
      console.log('업데이트 결과:', updateError);
      
      if (!updateError) {
        console.log('✅ 발행 성공!');
      } else {
        console.log('❌ 발행 실패:', updateError);
      }
    }
    
  } catch (error) {
    console.log('❌ 시뮬레이션 오류:', error);
  }
}

debugPayslipIssue().catch(console.error);
