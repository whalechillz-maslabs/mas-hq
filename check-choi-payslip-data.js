const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjczNiwiZXhwIjoyMDcwNDgyNzM2fQ.EKXlFrz2tLsAa-B4h-OGct2O1zODSMGuGp8nMZta4go'
);

async function checkChoiPayslipData() {
  console.log('=== 최형호 8월 급여명세서 데이터 확인 ===');
  
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
  
  // 8월 급여명세서 조회 (employees 관계 포함)
  const { data: payslip, error } = await supabase
    .from('payslips')
    .select(`
      *,
      employees!inner(name, employee_id, birth_date)
    `)
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
  console.log('Employee Name (from relation):', payslip.employees?.name);
  console.log('Employee Code (from relation):', payslip.employees?.employee_id);
  
  console.log('\n=== 급여 내역 ===');
  console.log('Base Salary:', payslip.base_salary);
  console.log('Weekly Holiday Pay:', payslip.weekly_holiday_pay);
  console.log('Overtime Pay:', payslip.overtime_pay);
  console.log('Meal Allowance:', payslip.meal_allowance);
  console.log('Point Bonus:', payslip.point_bonus);
  console.log('Total Earnings:', payslip.total_earnings);
  console.log('Tax Amount:', payslip.tax_amount);
  console.log('Net Salary:', payslip.net_salary);
  
  console.log('\n=== 주휴수당 표시 조건 테스트 ===');
  console.log('weekly_holiday_pay > 0:', (payslip.weekly_holiday_pay || 0) > 0);
  console.log('overtime_pay > 0:', (payslip.overtime_pay || 0) > 0);
  console.log('!weekly_holiday_pay:', !payslip.weekly_holiday_pay);
  console.log('overtime_pay > 0 && !weekly_holiday_pay:', (payslip.overtime_pay || 0) > 0 && !payslip.weekly_holiday_pay);
}

checkChoiPayslipData().catch(console.error);
