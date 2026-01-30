/**
 * 최형호 1월 급여명세서 확인
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgscbtxtgualkfalouwh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function verifyChoiJanuaryPayslip() {
  try {
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
    
    console.log('📊 현재 1월 명세서 상태:');
    console.log('   건강보험:', payslip.health_insurance?.toLocaleString(), '원');
    console.log('   고용보험:', payslip.employment_insurance?.toLocaleString(), '원');
    console.log('   장기요양보험료:', payslip.long_term_care_insurance?.toLocaleString(), '원');
    console.log('   공제액계:', payslip.total_insurance?.toLocaleString(), '원');
    console.log('   차인지급액:', payslip.net_salary?.toLocaleString(), '원');
    console.log('   상태:', payslip.status);
    console.log('   지급일:', payslip.paid_at ? new Date(payslip.paid_at).toLocaleString('ko-KR') : '미지급');
    
    console.log('\n📊 세무사 명세서 기준:');
    console.log('   건강보험: 84,430원');
    console.log('   고용보험: 4,500원');
    console.log('   장기요양보험료: 10,740원');
    console.log('   공제액계: 99,670원');
    console.log('   차인지급액: 2,240,330원');
    
    const isCorrect = 
      payslip.health_insurance === 84430 &&
      payslip.employment_insurance === 4500 &&
      payslip.long_term_care_insurance === 10740 &&
      payslip.total_insurance === 99670 &&
      payslip.net_salary === 2240330;
    
    console.log('\n✅ 검증 결과:', isCorrect ? '올바름' : '❌ 수정 필요');
    
    if (!isCorrect) {
      console.log('\n🔧 수정이 필요합니다. 수정 스크립트를 실행하세요.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

verifyChoiJanuaryPayslip();
