/**
 * 최형호 1월 급여명세서 수정
 * 세무사 차인지급액: 2,240,330원
 * 차이: 1,480원 (건강보험 계산 차이)
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgscbtxtgualkfalouwh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function fixChoiJanuaryPayslip() {
  try {
    console.log('🔍 최형호 1월 급여명세서 조회 중...');
    
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .or('name.eq.최형호,employee_id.eq.MASLABS-004')
      .single();
    
    if (!employee) {
      console.error('❌ 최형호 직원을 찾을 수 없습니다.');
      return;
    }
    
    const { data: payslip } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('period', '2026-01')
      .single();
    
    if (!payslip) {
      console.error('❌ 1월 급여명세서를 찾을 수 없습니다.');
      return;
    }
    
    console.log('📊 현재 상태:');
    console.log('   기본급:', payslip.base_salary?.toLocaleString(), '원');
    console.log('   건강보험:', payslip.health_insurance?.toLocaleString(), '원');
    console.log('   고용보험:', payslip.employment_insurance?.toLocaleString(), '원');
    console.log('   장기요양보험료:', payslip.long_term_care_insurance?.toLocaleString(), '원');
    console.log('   총 공제액:', payslip.total_insurance?.toLocaleString(), '원');
    console.log('   차인지급액 (현재):', payslip.net_salary?.toLocaleString(), '원');
    
    // 세무사 명세서 기준 계산
    const baseSalary = payslip.base_salary || 2340000;
    const taxAccountantNetSalary = 2240330;
    const taxAccountantTotalInsurance = baseSalary - taxAccountantNetSalary; // 99,670
    
    // 세무사 건강보험 역산 (고용보험, 장기요양보험료는 동일하다고 가정)
    const currentEmployment = payslip.employment_insurance || 4500;
    const currentLongTermCare = payslip.long_term_care_insurance || 10740;
    const taxAccountantHealthInsurance = taxAccountantTotalInsurance - currentEmployment - currentLongTermCare; // 84,430
    
    console.log('\n📊 세무사 명세서 기준:');
    console.log('   차인지급액:', taxAccountantNetSalary.toLocaleString(), '원');
    console.log('   공제액계:', taxAccountantTotalInsurance.toLocaleString(), '원');
    console.log('   건강보험 (역산):', taxAccountantHealthInsurance.toLocaleString(), '원');
    console.log('   고용보험:', currentEmployment.toLocaleString(), '원');
    console.log('   장기요양보험료:', currentLongTermCare.toLocaleString(), '원');
    
    // 건강보험 요율 역산
    const healthInsuranceRate = taxAccountantHealthInsurance / baseSalary;
    console.log('\n   건강보험 요율 역산:', (healthInsuranceRate * 100).toFixed(4), '%');
    console.log('   현재 요율:', '3.545%');
    
    // 1월 급여명세서 수정
    console.log('\n🔧 1월 급여명세서 수정 중...');
    const { error: updateError } = await supabase
      .from('payslips')
      .update({
        health_insurance: taxAccountantHealthInsurance,
        total_insurance: taxAccountantTotalInsurance,
        net_salary: taxAccountantNetSalary,
        updated_at: new Date().toISOString(),
        notes: '세무사 실제 발행 명세서 기준 수정 (2026-01): 건강보험 요율 3.6081% 적용'
      })
      .eq('id', payslip.id);
    
    if (updateError) {
      console.error('❌ 수정 실패:', updateError);
      return;
    }
    
    console.log('✅ 1월 급여명세서 수정 완료!');
    console.log('   수정 전 차인지급액:', payslip.net_salary?.toLocaleString(), '원');
    console.log('   수정 후 차인지급액:', taxAccountantNetSalary.toLocaleString(), '원');
    console.log('   세무사 명세서:', '2,240,330원 ✅');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixChoiJanuaryPayslip();
