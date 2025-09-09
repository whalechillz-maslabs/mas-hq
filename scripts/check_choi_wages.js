const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkChoiHyungHoWages() {
  console.log('🔍 최형호 시급 관리 상태 확인 중...');
  
  try {
    // 1. 최형호 직원 정보 확인
    console.log('\n1. 최형호 직원 정보 확인 중...');
    const { data: choiEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id, monthly_salary, hourly_rate, employment_type')
      .eq('name', '최형호')
      .single();
    
    if (employeeError) {
      console.log('❌ 최형호 직원 정보 조회 실패:', employeeError.message);
      return;
    }
    
    if (!choiEmployee) {
      console.log('❌ 최형호 직원을 찾을 수 없습니다');
      return;
    }
    
    console.log('✅ 최형호 직원 정보:');
    console.log('  - ID:', choiEmployee.id);
    console.log('  - 이름:', choiEmployee.name);
    console.log('  - 직원ID:', choiEmployee.employee_id);
    console.log('  - 고용형태:', choiEmployee.employment_type);
    console.log('  - 월급:', choiEmployee.monthly_salary);
    console.log('  - 시급:', choiEmployee.hourly_rate);
    
    // 2. 최형호의 시급 데이터 확인
    console.log('\n2. 최형호 시급 데이터 확인 중...');
    const { data: choiWages, error: wagesError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .order('effective_start_date', { ascending: false });
    
    if (wagesError) {
      console.log('❌ 시급 데이터 조회 실패:', wagesError.message);
      return;
    }
    
    console.log('✅ 최형호 시급 데이터 (총 ' + choiWages.length + '개):');
    
    if (choiWages.length === 0) {
      console.log('⚠️ 최형호의 시급 데이터가 없습니다');
    } else {
      choiWages.forEach((wage, index) => {
        console.log(`\n  📋 시급 기록 ${index + 1}:`);
        console.log('    - ID:', wage.id);
        console.log('    - 기본시급:', wage.base_wage + '원');
        console.log('    - 초과근무배수:', wage.overtime_multiplier);
        console.log('    - 야간근무배수:', wage.night_multiplier);
        console.log('    - 휴일근무배수:', wage.holiday_multiplier);
        console.log('    - 적용시작일:', wage.effective_start_date);
        console.log('    - 적용종료일:', wage.effective_end_date || '없음');
        console.log('    - 상태:', wage.status);
        console.log('    - 생성일:', wage.created_at);
      });
    }
    
    // 3. 데이터 무결성 확인
    console.log('\n3. 데이터 무결성 확인 중...');
    
    // undefined 값 확인
    const hasUndefinedValues = choiWages.some(wage => 
      wage.night_multiplier === undefined || 
      wage.night_multiplier === null ||
      wage.holiday_multiplier === undefined || 
      wage.holiday_multiplier === null
    );
    
    if (hasUndefinedValues) {
      console.log('❌ undefined 값이 발견되었습니다');
      choiWages.forEach((wage, index) => {
        if (wage.night_multiplier === undefined || wage.night_multiplier === null) {
          console.log(`  - 시급 기록 ${index + 1}: night_multiplier가 undefined/null`);
        }
        if (wage.holiday_multiplier === undefined || wage.holiday_multiplier === null) {
          console.log(`  - 시급 기록 ${index + 1}: holiday_multiplier가 undefined/null`);
        }
      });
    } else {
      console.log('✅ 모든 배수 값이 정상적으로 설정되어 있습니다');
    }
    
    // 4. 최신 시급 정보 요약
    if (choiWages.length > 0) {
      const latestWage = choiWages[0];
      console.log('\n4. 최신 시급 정보 요약:');
      console.log('  - 현재 시급:', latestWage.base_wage + '원');
      console.log('  - 초과근무:', latestWage.overtime_multiplier + '배');
      console.log('  - 야간근무:', latestWage.night_multiplier + '배');
      console.log('  - 휴일근무:', latestWage.holiday_multiplier + '배');
      console.log('  - 적용기간:', latestWage.effective_start_date + ' ~ ' + (latestWage.effective_end_date || '현재'));
      console.log('  - 상태:', latestWage.status);
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  checkChoiHyungHoWages().catch(console.error);
}

module.exports = { checkChoiHyungHoWages };
