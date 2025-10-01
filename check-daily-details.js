const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjczNiwiZXhwIjoyMDcwNDgyNzM2fQ.EKXlFrz2tLsAa-B4h-OGct2O1zODSMGuGp8nMZta4go'
);

async function checkDailyDetails() {
  console.log('=== 최형호 8월 급여명세서 daily_details 확인 ===');
  
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
  
  console.log('=== 급여명세서 정보 ===');
  console.log('ID:', payslip.id);
  console.log('Period:', payslip.period);
  console.log('Status:', payslip.status);
  console.log('Total Hours:', payslip.total_hours);
  console.log('Hourly Rate:', payslip.hourly_rate);
  
  console.log('\n=== daily_details 확인 ===');
  console.log('daily_details 존재 여부:', !!payslip.daily_details);
  console.log('daily_details 타입:', typeof payslip.daily_details);
  
  if (payslip.daily_details) {
    console.log('daily_details 길이:', payslip.daily_details.length);
    console.log('daily_details 내용:', JSON.stringify(payslip.daily_details, null, 2));
  } else {
    console.log('daily_details가 null 또는 undefined입니다.');
  }
  
  // employees 관계와 함께 조회
  console.log('\n=== employees 관계와 함께 조회 ===');
  const { data: payslipWithEmployee, error: employeeError } = await supabase
    .from('payslips')
    .select(`
      *,
      employees!inner(name, employee_id, birth_date)
    `)
    .eq('employee_id', employee.id)
    .eq('period', '2025-08')
    .single();
    
  if (employeeError) {
    console.log('employees 관계 조회 오류:', employeeError);
    return;
  }
  
  console.log('Employee Name:', payslipWithEmployee.employees?.name);
  console.log('Employee Code:', payslipWithEmployee.employees?.employee_id);
  console.log('daily_details with employee:', !!payslipWithEmployee.daily_details);
  
  if (payslipWithEmployee.daily_details) {
    console.log('daily_details 길이 (with employee):', payslipWithEmployee.daily_details.length);
  }
}

checkDailyDetails().catch(console.error);
