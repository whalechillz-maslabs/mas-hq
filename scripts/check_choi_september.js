const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkChoiSeptemberData() {
  console.log('🔍 최형호 9월 이후 데이터 확인 중...');
  
  try {
    // 1. 최형호 직원 정보 확인
    const { data: choiEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id, monthly_salary, hourly_rate, employment_type')
      .eq('name', '최형호')
      .single();
    
    if (employeeError || !choiEmployee) {
      console.log('❌ 최형호 직원 정보를 찾을 수 없습니다');
      return;
    }
    
    console.log('✅ 최형호 직원 정보:');
    console.log('  - 이름:', choiEmployee.name);
    console.log('  - 직원ID:', choiEmployee.employee_id);
    console.log('  - 고용형태:', choiEmployee.employment_type);
    console.log('  - 월급:', choiEmployee.monthly_salary);
    console.log('  - 시급:', choiEmployee.hourly_rate);
    
    // 2. 9월 이후 시급 데이터 확인
    console.log('\n2. 9월 이후 시급 데이터 확인 중...');
    const { data: septemberWages, error: wagesError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('effective_start_date', '2025-09-01')
      .order('effective_start_date', { ascending: false });
    
    if (wagesError) {
      console.log('❌ 시급 데이터 조회 실패:', wagesError.message);
      return;
    }
    
    console.log('✅ 9월 이후 시급 데이터 (총 ' + septemberWages.length + '개):');
    
    if (septemberWages.length === 0) {
      console.log('⚠️ 9월 이후 시급 데이터가 없습니다');
      console.log('   → 최형호가 9월부터 월급제로 전환되어 시급 데이터가 없는 것이 정상입니다');
    } else {
      septemberWages.forEach((wage, index) => {
        console.log(`\n  📋 9월 이후 시급 기록 ${index + 1}:`);
        console.log('    - 기본시급:', wage.base_wage + '원');
        console.log('    - 적용시작일:', wage.effective_start_date);
        console.log('    - 적용종료일:', wage.effective_end_date || '없음');
        console.log('    - 상태:', wage.status);
      });
    }
    
    // 3. 9월 이후 급여 데이터 확인
    console.log('\n3. 9월 이후 급여 데이터 확인 중...');
    const { data: septemberSalaries, error: salariesError } = await supabase
      .from('salaries')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('salary_month', '2025-09')
      .order('salary_month', { ascending: false });
    
    if (salariesError) {
      console.log('❌ 급여 데이터 조회 실패:', salariesError.message);
      return;
    }
    
    console.log('✅ 9월 이후 급여 데이터 (총 ' + septemberSalaries.length + '개):');
    
    if (septemberSalaries.length === 0) {
      console.log('⚠️ 9월 이후 급여 데이터가 없습니다');
      console.log('   → 월급제 전환 후 급여 데이터가 아직 생성되지 않았습니다');
    } else {
      septemberSalaries.forEach((salary, index) => {
        console.log(`\n  📋 9월 이후 급여 기록 ${index + 1}:`);
        console.log('    - 급여월:', salary.salary_month);
        console.log('    - 기본급:', salary.base_salary + '원');
        console.log('    - 총급여:', salary.total_salary + '원');
        console.log('    - 상태:', salary.status);
      });
    }
    
    // 4. 9월 이후 근무 기록 확인
    console.log('\n4. 9월 이후 근무 기록 확인 중...');
    const { data: septemberWork, error: workError } = await supabase
      .from('daily_work_records')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('work_date', '2025-09-01')
      .order('work_date', { ascending: false });
    
    if (workError) {
      console.log('❌ 근무 기록 조회 실패:', workError.message);
      return;
    }
    
    console.log('✅ 9월 이후 근무 기록 (총 ' + septemberWork.length + '개):');
    
    if (septemberWork.length === 0) {
      console.log('⚠️ 9월 이후 근무 기록이 없습니다');
    } else {
      septemberWork.forEach((work, index) => {
        console.log(`\n  📋 9월 이후 근무 기록 ${index + 1}:`);
        console.log('    - 근무일:', work.work_date);
        console.log('    - 출근시간:', work.check_in_time);
        console.log('    - 퇴근시간:', work.check_out_time);
        console.log('    - 근무시간:', work.work_hours + '시간');
      });
    }
    
    // 5. 결론
    console.log('\n📊 결론:');
    if (choiEmployee.employment_type === 'full_time' && choiEmployee.monthly_salary > 0) {
      console.log('✅ 최형호는 9월부터 월급제로 전환되었습니다');
      console.log('✅ 시급 데이터가 없는 것이 정상입니다 (월급제이므로)');
      if (septemberSalaries.length === 0) {
        console.log('⚠️ 9월 급여 데이터가 아직 생성되지 않았습니다');
        console.log('   → 급여 생성 기능을 사용하여 9월 급여를 생성해야 합니다');
      }
    } else {
      console.log('❌ 최형호의 고용형태가 월급제로 설정되지 않았습니다');
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  checkChoiSeptemberData().catch(console.error);
}

module.exports = { checkChoiSeptemberData };
