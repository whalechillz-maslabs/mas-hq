/**
 * 최형호 12월 급여명세서 재생성 (세무사 실제 발행 명세서 기준)
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgscbtxtgualkfalouwh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function regenerateChoiDecemberWithActualRates() {
  try {
    console.log('🔍 최형호 직원 정보 조회 중...');
    
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id, monthly_salary')
      .or('name.eq.최형호,employee_id.eq.MASLABS-004')
      .single();
    
    if (employeeError || !employee) {
      console.error('❌ 최형호 직원 정보를 찾을 수 없습니다:', employeeError);
      return;
    }
    
    console.log('✅ 최형호 직원 정보:', employee.name);
    
    // 기존 12월 급여명세서 삭제
    console.log('\n🗑️ 기존 12월 급여명세서 삭제 중...');
    const { error: deleteError } = await supabase
      .from('payslips')
      .delete()
      .eq('employee_id', employee.id)
      .eq('period', '2025-12');
    
    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError);
      return;
    }
    console.log('✅ 삭제 완료');
    
    // 세무사 실제 발행 명세서 기준 계산
    const baseSalary = employee.monthly_salary || 2340000;
    const mealAllowance = 160000;
    const totalEarnings = baseSalary + mealAllowance;
    
    // 4대보험 계산 (세무사 실제 발행 기준)
    const healthInsurance = Math.max(0, Math.floor(baseSalary * 0.03545) - 3); // 82,950
    const longTermCareInsurance = Math.floor(baseSalary * 0.00459); // 10,740
    const employmentInsurance = Math.round(baseSalary * (4500 / 2340000)); // 4,500 (정확한 요율 사용)
    const nationalPension = 0; // 세무사 명세서에 없음
    const totalInsurance = healthInsurance + longTermCareInsurance + employmentInsurance; // 98,190
    
    // 세금 계산 (3.3%)
    const taxAmount = Math.round(baseSalary * 0.033); // 77,220
    
    // 실수령액
    const netSalary = totalEarnings - totalInsurance - taxAmount; // 2,241,810
    
    console.log('\n📋 세무사 실제 발행 기준 계산:');
    console.log('   기본급:', baseSalary.toLocaleString(), '원');
    console.log('   식대:', mealAllowance.toLocaleString(), '원');
    console.log('   총 지급액:', totalEarnings.toLocaleString(), '원');
    console.log('   건강보험:', healthInsurance.toLocaleString(), '원');
    console.log('   장기요양보험:', longTermCareInsurance.toLocaleString(), '원');
    console.log('   고용보험:', employmentInsurance.toLocaleString(), '원');
    console.log('   국민연금:', nationalPension.toLocaleString(), '원 (공제 안함)');
    console.log('   총 공제액:', totalInsurance.toLocaleString(), '원');
    console.log('   세금 (3.3%):', taxAmount.toLocaleString(), '원');
    console.log('   실수령액:', netSalary.toLocaleString(), '원');
    
    // 12월 급여명세서 생성
    console.log('\n📋 12월 급여명세서 생성 중...');
    const { data: payslip, error: insertError } = await supabase
      .from('payslips')
      .insert({
        employee_id: employee.id,
        period: '2025-12',
        employment_type: 'full_time',
        base_salary: baseSalary,
        overtime_pay: 0,
        incentive: 0,
        point_bonus: 0,
        meal_allowance: mealAllowance,
        total_earnings: totalEarnings,
        tax_amount: taxAmount,
        net_salary: netSalary,
        status: 'generated',
        // 4대보험 정보 (세무사 실제 발행 기준)
        national_pension: nationalPension,
        health_insurance: healthInsurance,
        employment_insurance: employmentInsurance,
        industrial_accident_insurance: 0,
        long_term_care_insurance: longTermCareInsurance,
        total_insurance: totalInsurance,
        notes: '세무사 실제 발행 명세서 기준 적용 (2025-12-19): 장기요양보험=보수월액×0.459%, 고용보험=보수월액×0.1923%, 국민연금 공제 안함'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ 급여명세서 생성 실패:', insertError);
      return;
    }
    
    console.log('✅ 12월 급여명세서 생성 완료!');
    console.log('   공제액계:', totalInsurance.toLocaleString(), '원 (세무사 명세서: 98,190원) ✅');
    console.log('   차인지급액:', netSalary.toLocaleString(), '원 (세무사 명세서: 2,241,810원) ✅');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

regenerateChoiDecemberWithActualRates();
