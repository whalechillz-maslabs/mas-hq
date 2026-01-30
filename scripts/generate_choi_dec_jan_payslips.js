/**
 * 최형호 12월/1월 급여명세서 생성 스크립트
 * 수정된 4대보험 요율로 급여명세서 생성
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgscbtxtgualkfalouwh.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 4대보험 계산 함수 (수정된 버전)
const calculateInsurance = (baseAmount, employeeAge = 30) => {
  const round = (v) => Math.floor(v);
  
  // 국민연금: 4.5% (60세 이상 제외)
  const nationalPension = employeeAge >= 60 ? 0 : round(baseAmount * 0.045);
  
  // 건강보험: 3.545% (3원 절사)
  const healthInsurance = Math.max(0, round(baseAmount * 0.03545) - 3);
  
  // 장기요양보험: 건강보험료의 0.9182%
  const longTermCareInsurance = round(healthInsurance * 0.009182);
  
  // 고용보험: 0.9%
  const employmentInsurance = round(baseAmount * 0.009);
  
  // 산재보험: 0원 (사업주 부담)
  const industrialAccidentInsurance = 0;
  
  const totalInsurance = nationalPension + healthInsurance + longTermCareInsurance + employmentInsurance + industrialAccidentInsurance;
  
  return {
    nationalPension,
    healthInsurance,
    longTermCareInsurance,
    employmentInsurance,
    industrialAccidentInsurance,
    totalInsurance
  };
};

async function generateChoiPayslips() {
  try {
    console.log('🔍 최형호 직원 정보 조회 중...');
    
    // 최형호 직원 정보 조회
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .or('name.eq.최형호,employee_id.eq.MASLABS-004')
      .single();
    
    if (employeeError || !employees) {
      console.error('❌ 최형호 직원 정보를 찾을 수 없습니다:', employeeError);
      return;
    }
    
    console.log('✅ 최형호 직원 정보:', {
      name: employees.name,
      employee_id: employees.employee_id,
      monthly_salary: employees.monthly_salary,
      employment_type: employees.employment_type
    });
    
    const baseSalary = employees.monthly_salary || 2340000; // 기본급
    const mealAllowance = 160000; // 식대
    const totalEarnings = baseSalary + mealAllowance; // 총 지급액
    
    // 기본급 기준으로 4대보험 계산
    const insurance = calculateInsurance(baseSalary, 30);
    
    // 세금 계산 (3.3%)
    const taxAmount = Math.round(baseSalary * 0.033);
    
    // 실수령액 = 총 지급액 - 4대보험 - 세금
    const netSalary = totalEarnings - insurance.totalInsurance - taxAmount;
    
    // 12월 급여명세서 생성
    console.log('\n📋 최형호 12월 급여명세서 생성 중...');
    const decemberPayslip = {
      employee_id: employees.id,
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
      // 4대보험 정보
      national_pension: insurance.nationalPension,
      health_insurance: insurance.healthInsurance,
      employment_insurance: insurance.employmentInsurance,
      industrial_accident_insurance: insurance.industrialAccidentInsurance,
      long_term_care_insurance: insurance.longTermCareInsurance,
      total_insurance: insurance.totalInsurance,
      notes: '수정된 4대보험 요율 적용 (장기요양보험: 건강보험료 × 0.9182%)'
    };
    
    const { error: decError } = await supabase
      .from('payslips')
      .upsert([decemberPayslip], {
        onConflict: 'employee_id,period'
      });
    
    if (decError) {
      console.error('❌ 12월 급여명세서 생성 실패:', decError);
    } else {
      console.log('✅ 12월 급여명세서 생성 완료');
      console.log('   기본급:', baseSalary.toLocaleString(), '원');
      console.log('   식대:', mealAllowance.toLocaleString(), '원');
      console.log('   총 지급액:', totalEarnings.toLocaleString(), '원');
      console.log('   건강보험:', insurance.healthInsurance.toLocaleString(), '원');
      console.log('   장기요양보험:', insurance.longTermCareInsurance.toLocaleString(), '원');
      console.log('   고용보험:', insurance.employmentInsurance.toLocaleString(), '원');
      console.log('   국민연금:', insurance.nationalPension.toLocaleString(), '원');
      console.log('   총 공제액:', insurance.totalInsurance.toLocaleString(), '원');
      console.log('   세금 (3.3%):', taxAmount.toLocaleString(), '원');
      console.log('   실수령액:', netSalary.toLocaleString(), '원');
    }
    
    // 1월 급여명세서 생성
    console.log('\n📋 최형호 1월 급여명세서 생성 중...');
    const januaryPayslip = {
      ...decemberPayslip,
      period: '2026-01',
      notes: '수정된 4대보험 요율 적용 (장기요양보험: 건강보험료 × 0.9182%)'
    };
    
    const { error: janError } = await supabase
      .from('payslips')
      .upsert([januaryPayslip], {
        onConflict: 'employee_id,period'
      });
    
    if (janError) {
      console.error('❌ 1월 급여명세서 생성 실패:', janError);
    } else {
      console.log('✅ 1월 급여명세서 생성 완료');
      console.log('   기본급:', baseSalary.toLocaleString(), '원');
      console.log('   식대:', mealAllowance.toLocaleString(), '원');
      console.log('   총 지급액:', totalEarnings.toLocaleString(), '원');
      console.log('   건강보험:', insurance.healthInsurance.toLocaleString(), '원');
      console.log('   장기요양보험:', insurance.longTermCareInsurance.toLocaleString(), '원');
      console.log('   고용보험:', insurance.employmentInsurance.toLocaleString(), '원');
      console.log('   국민연금:', insurance.nationalPension.toLocaleString(), '원');
      console.log('   총 공제액:', insurance.totalInsurance.toLocaleString(), '원');
      console.log('   세금 (3.3%):', taxAmount.toLocaleString(), '원');
      console.log('   실수령액:', netSalary.toLocaleString(), '원');
    }
    
    console.log('\n✅ 최형호 12월/1월 급여명세서 생성 완료!');
    console.log('\n📝 세무사 발행 시 비고란에 남길 내용:');
    console.log('   "수정된 4대보험 요율 적용 (2025-12-19)');
    console.log('   - 장기요양보험: 건강보험료 × 0.9182% (기존: 보수월액 × 0.459%)');
    console.log('   - 건강보험: 보수월액 × 3.545%');
    console.log('   - 고용보험: 보수월액 × 0.9%"');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
generateChoiPayslips();
