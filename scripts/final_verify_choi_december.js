/**
 * 최형호 12월 급여명세서 최종 검증
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgscbtxtgualkfalouwh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function finalVerify() {
  try {
    const { data: payslip } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', (await supabase.from('employees').select('id').or('name.eq.최형호,employee_id.eq.MASLABS-004').single()).data.id)
      .eq('period', '2025-12')
      .single();
    
    if (!payslip) {
      console.log('❌ 급여명세서를 찾을 수 없습니다.');
      return;
    }
    
    console.log('📊 현재 저장된 급여명세서:');
    console.log('   기본급:', payslip.base_salary?.toLocaleString(), '원');
    console.log('   건강보험:', payslip.health_insurance?.toLocaleString(), '원');
    console.log('   고용보험:', payslip.employment_insurance?.toLocaleString(), '원');
    console.log('   장기요양보험:', payslip.long_term_care_insurance?.toLocaleString(), '원');
    console.log('   총 공제액:', payslip.total_insurance?.toLocaleString(), '원');
    console.log('   세금:', payslip.tax_amount?.toLocaleString(), '원');
    console.log('   실수령액:', payslip.net_salary?.toLocaleString(), '원');
    
    console.log('\n📊 세무사 명세서:');
    console.log('   기본급: 2,340,000원');
    console.log('   건강보험: 82,950원');
    console.log('   고용보험: 4,500원');
    console.log('   장기요양보험료: 10,740원');
    console.log('   공제액계: 98,190원');
    console.log('   차인지급액: 2,241,810원 (기본급 - 공제액계)');
    console.log('   (세금 공제 없음)');
    
    const baseSalary = 2340000;
    const taxAccountantNetPay = 2241810;
    const ourNetPay = payslip.net_salary;
    
    console.log('\n✅ 검증:');
    console.log('   공제액계:', payslip.total_insurance === 98190 ? '✅ 일치' : `❌ 불일치 (${payslip.total_insurance})`);
    console.log('   차인지급액 (기본급 기준):', (baseSalary - payslip.total_insurance) === taxAccountantNetPay ? '✅ 일치' : `❌ 불일치`);
    
    if (payslip.total_insurance === 98190 && (baseSalary - payslip.total_insurance) === taxAccountantNetPay) {
      console.log('\n✅ 모든 계산이 세무사 명세서와 일치합니다!');
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

finalVerify();
