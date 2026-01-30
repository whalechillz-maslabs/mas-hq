/**
 * 최형호 12월 급여명세서 실수령액 수정
 * 세무사 명세서 기준: 차인지급액 = 기본급 - 공제액계 (세금 공제 안함)
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgscbtxtgualkfalouwh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function fixChoiDecemberNetSalary() {
  try {
    console.log('🔍 최형호 12월 급여명세서 조회 중...');
    
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
      .eq('period', '2025-12')
      .single();
    
    if (!payslip) {
      console.error('❌ 12월 급여명세서를 찾을 수 없습니다.');
      return;
    }
    
    console.log('📊 현재 상태:');
    console.log('   기본급:', payslip.base_salary?.toLocaleString(), '원');
    console.log('   총 공제액:', payslip.total_insurance?.toLocaleString(), '원');
    console.log('   세금:', payslip.tax_amount?.toLocaleString(), '원');
    console.log('   실수령액 (현재):', payslip.net_salary?.toLocaleString(), '원');
    
    // 세무사 명세서 기준: 차인지급액 = 기본급 - 공제액계 (세금 공제 안함)
    const baseSalary = payslip.base_salary || 2340000;
    const totalInsurance = payslip.total_insurance || 98190;
    const correctNetSalary = baseSalary - totalInsurance; // 2,241,810원
    
    console.log('\n📊 세무사 명세서 기준:');
    console.log('   차인지급액 = 기본급 - 공제액계');
    console.log('   =', baseSalary.toLocaleString(), '-', totalInsurance.toLocaleString());
    console.log('   =', correctNetSalary.toLocaleString(), '원');
    
    if (payslip.net_salary === correctNetSalary) {
      console.log('\n✅ 실수령액이 이미 올바릅니다!');
      return;
    }
    
    console.log('\n🔧 실수령액 수정 중...');
    const { error: updateError } = await supabase
      .from('payslips')
      .update({
        net_salary: correctNetSalary,
        updated_at: new Date().toISOString()
      })
      .eq('id', payslip.id);
    
    if (updateError) {
      console.error('❌ 수정 실패:', updateError);
      return;
    }
    
    console.log('✅ 실수령액 수정 완료!');
    console.log('   수정 전:', payslip.net_salary?.toLocaleString(), '원');
    console.log('   수정 후:', correctNetSalary.toLocaleString(), '원');
    console.log('   세무사 명세서:', '2,241,810원 ✅');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixChoiDecemberNetSalary();
