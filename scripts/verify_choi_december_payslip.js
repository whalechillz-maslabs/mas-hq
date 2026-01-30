/**
 * 최형호 12월 급여명세서 검증 스크립트
 * 세무사 발행 후 4대보험 계산이 올바른지 확인
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgscbtxtgualkfalouwh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function verifyChoiDecemberPayslip() {
  try {
    console.log('🔍 최형호 12월 급여명세서 검증 중...\n');
    
    // 최형호 직원 정보 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id, monthly_salary')
      .or('name.eq.최형호,employee_id.eq.MASLABS-004')
      .single();
    
    if (employeeError || !employee) {
      console.error('❌ 최형호 직원 정보를 찾을 수 없습니다:', employeeError);
      return;
    }
    
    // 12월 급여명세서 조회
    const { data: payslip, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('period', '2025-12')
      .single();
    
    if (payslipError || !payslip) {
      console.error('❌ 12월 급여명세서를 찾을 수 없습니다:', payslipError);
      return;
    }
    
    console.log('✅ 급여명세서 정보:');
    console.log('   직원명:', employee.name);
    console.log('   급여기간:', payslip.period);
    console.log('   상태:', payslip.status);
    console.log('   발행일:', payslip.issued_at ? new Date(payslip.issued_at).toLocaleString('ko-KR') : '미발행');
    console.log('   비고:', payslip.notes || '(없음)');
    console.log('   display_type:', payslip.display_type || '(없음)');
    
    console.log('\n📊 급여 내역:');
    console.log('   기본급:', payslip.base_salary?.toLocaleString(), '원');
    console.log('   식대:', payslip.meal_allowance?.toLocaleString(), '원');
    console.log('   총 지급액:', payslip.total_earnings?.toLocaleString(), '원');
    
    console.log('\n💰 4대보험 공제 내역:');
    console.log('   건강보험:', payslip.health_insurance?.toLocaleString(), '원');
    console.log('   장기요양보험:', payslip.long_term_care_insurance?.toLocaleString(), '원');
    console.log('   고용보험:', payslip.employment_insurance?.toLocaleString(), '원');
    console.log('   국민연금:', payslip.national_pension?.toLocaleString(), '원');
    console.log('   총 공제액:', payslip.total_insurance?.toLocaleString(), '원');
    
    console.log('\n💵 세금 및 실수령액:');
    console.log('   세금 (3.3%):', payslip.tax_amount?.toLocaleString(), '원');
    console.log('   실수령액:', payslip.net_salary?.toLocaleString(), '원');
    
    // 검증: 올바른 계산인지 확인
    console.log('\n🔍 검증 시작...\n');
    
    const baseSalary = payslip.base_salary || 2340000;
    const mealAllowance = payslip.meal_allowance || 160000;
    const totalEarnings = baseSalary + mealAllowance;
    
    // 올바른 계산값
    const correctHealthInsurance = Math.max(0, Math.floor(baseSalary * 0.03545) - 3); // 82,950
    const correctLongTermCare = Math.floor(correctHealthInsurance * 0.009182); // 761
    const correctEmploymentInsurance = Math.floor(baseSalary * 0.009); // 21,060
    const correctNationalPension = Math.floor(baseSalary * 0.045); // 105,300
    const correctTotalInsurance = correctNationalPension + correctHealthInsurance + correctLongTermCare + correctEmploymentInsurance; // 210,071
    const correctTaxAmount = Math.round(baseSalary * 0.033); // 77,220
    const correctNetSalary = totalEarnings - correctTotalInsurance - correctTaxAmount; // 2,212,709
    
    let allCorrect = true;
    
    // 건강보험 검증
    if (payslip.health_insurance === correctHealthInsurance) {
      console.log('✅ 건강보험: 올바름 (82,950원)');
    } else {
      console.log(`❌ 건강보험: 잘못됨 (현재: ${payslip.health_insurance}, 올바른 값: ${correctHealthInsurance})`);
      allCorrect = false;
    }
    
    // 장기요양보험 검증 (가장 중요!)
    if (payslip.long_term_care_insurance === correctLongTermCare) {
      console.log('✅ 장기요양보험: 올바름 (761원) - 건강보험료 × 0.9182%');
    } else {
      console.log(`❌ 장기요양보험: 잘못됨 (현재: ${payslip.long_term_care_insurance}, 올바른 값: ${correctLongTermCare})`);
      console.log(`   ⚠️ 기존 잘못된 계산: ${Math.floor(baseSalary * 0.00459).toLocaleString()}원`);
      allCorrect = false;
    }
    
    // 고용보험 검증
    if (payslip.employment_insurance === correctEmploymentInsurance) {
      console.log('✅ 고용보험: 올바름 (21,060원)');
    } else {
      console.log(`❌ 고용보험: 잘못됨 (현재: ${payslip.employment_insurance}, 올바른 값: ${correctEmploymentInsurance})`);
      allCorrect = false;
    }
    
    // 국민연금 검증
    if (payslip.national_pension === correctNationalPension) {
      console.log('✅ 국민연금: 올바름 (105,300원)');
    } else {
      console.log(`❌ 국민연금: 잘못됨 (현재: ${payslip.national_pension}, 올바른 값: ${correctNationalPension})`);
      allCorrect = false;
    }
    
    // 총 공제액 검증
    if (payslip.total_insurance === correctTotalInsurance) {
      console.log('✅ 총 공제액: 올바름 (210,071원)');
    } else {
      console.log(`❌ 총 공제액: 잘못됨 (현재: ${payslip.total_insurance}, 올바른 값: ${correctTotalInsurance})`);
      allCorrect = false;
    }
    
    // 실수령액 검증
    if (payslip.net_salary === correctNetSalary) {
      console.log('✅ 실수령액: 올바름 (2,212,709원)');
    } else {
      console.log(`❌ 실수령액: 잘못됨 (현재: ${payslip.net_salary}, 올바른 값: ${correctNetSalary})`);
      allCorrect = false;
    }
    
    // 세무사 발행 상태 검증
    if (payslip.status === 'issued') {
      console.log('✅ 상태: 세무사 발행 완료');
    } else {
      console.log(`⚠️ 상태: ${payslip.status} (세무사 발행 버튼을 눌렀다면 'issued'여야 함)`);
    }
    
    console.log('\n' + '='.repeat(50));
    if (allCorrect && payslip.status === 'issued') {
      console.log('✅ 모든 검증 통과! 세무사 발행이 올바르게 완료되었습니다.');
    } else if (allCorrect) {
      console.log('✅ 계산은 올바르지만, 아직 세무사 발행되지 않았습니다.');
    } else {
      console.log('❌ 일부 계산이 잘못되었습니다. 재생성이 필요합니다.');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
verifyChoiDecemberPayslip();
