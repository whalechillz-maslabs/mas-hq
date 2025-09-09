const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function verifyHourlyWages() {
  console.log('=== hourly_wages 시스템 확인 ===');
  
  try {
    // 1. hourly_wages 테이블 존재 확인
    console.log('\n1. hourly_wages 테이블 존재 확인 중...');
    const { data: wagesData, error: wagesError } = await supabase
      .from('hourly_wages')
      .select('*')
      .limit(1);
    
    if (wagesError) {
      console.log('❌ hourly_wages 테이블이 존재하지 않습니다:', wagesError.message);
      console.log('📝 Supabase Dashboard에서 테이블 생성 SQL을 먼저 실행해주세요.');
      return;
    }
    
    console.log('✅ hourly_wages 테이블이 존재합니다.');
    
    // 2. 최형호 시급 데이터 확인
    console.log('\n2. 최형호 시급 데이터 확인 중...');
    const { data: choiWages, error: choiWagesError } = await supabase
      .from('hourly_wages')
      .select(`
        id,
        base_wage,
        effective_start_date,
        effective_end_date,
        status,
        employees!inner(name, employee_id)
      `)
      .eq('employees.name', '최형호')
      .order('effective_start_date');
    
    if (choiWagesError) {
      console.log('❌ 최형호 시급 데이터 확인 실패:', choiWagesError);
    } else if (choiWages.length === 0) {
      console.log('⚠️  최형호 시급 데이터가 없습니다.');
      console.log('📝 Supabase Dashboard에서 시급 데이터 입력 SQL을 실행해주세요.');
    } else {
      console.log('✅ 최형호 시급 데이터 확인:');
      choiWages.forEach((wage, index) => {
        console.log(`  ${index + 1}. ${wage.effective_start_date} - ${wage.effective_end_date}: ${wage.base_wage.toLocaleString()}원 (${wage.status})`);
      });
    }
    
    // 3. 최형호 직원 정보 확인
    console.log('\n3. 최형호 직원 정보 확인 중...');
    const { data: choiEmployee, error: choiEmployeeError } = await supabase
      .from('employees')
      .select('name, employee_id, employment_type, hourly_rate, monthly_salary')
      .eq('name', '최형호')
      .single();
    
    if (choiEmployeeError) {
      console.log('❌ 최형호 직원 정보 확인 실패:', choiEmployeeError);
    } else {
      console.log('✅ 최형호 직원 정보:');
      console.log(`  이름: ${choiEmployee.name}`);
      console.log(`  직원 ID: ${choiEmployee.employee_id}`);
      console.log(`  고용 형태: ${choiEmployee.employment_type}`);
      console.log(`  시급: ${choiEmployee.hourly_rate?.toLocaleString() || 'null'}원`);
      console.log(`  월급: ${choiEmployee.monthly_salary?.toLocaleString() || 'null'}원`);
    }
    
    // 4. 전체 hourly_wages 데이터 확인
    console.log('\n4. 전체 hourly_wages 데이터 확인 중...');
    const { data: allWages, error: allWagesError } = await supabase
      .from('hourly_wages')
      .select(`
        id,
        base_wage,
        effective_start_date,
        effective_end_date,
        status,
        employees!inner(name, employee_id)
      `)
      .order('employees.name, effective_start_date');
    
    if (allWagesError) {
      console.log('❌ 전체 시급 데이터 확인 실패:', allWagesError);
    } else {
      console.log(`✅ 전체 시급 데이터: ${allWages.length}개`);
      allWages.forEach((wage, index) => {
        console.log(`  ${index + 1}. ${wage.employees.name} (${wage.employees.employee_id}): ${wage.effective_start_date} - ${wage.effective_end_date}: ${wage.base_wage.toLocaleString()}원`);
      });
    }
    
    // 5. 시스템 상태 요약
    console.log('\n=== 시스템 상태 요약 ===');
    console.log(`✅ hourly_wages 테이블: 존재`);
    console.log(`✅ 최형호 시급 데이터: ${choiWages?.length || 0}개`);
    console.log(`✅ 최형호 고용 형태: ${choiEmployee?.employment_type || '미확인'}`);
    console.log(`✅ 전체 시급 데이터: ${allWages?.length || 0}개`);
    
    if (choiWages?.length > 0 && choiEmployee?.employment_type === 'full_time') {
      console.log('\n🎉 hourly_wages 시스템이 성공적으로 구축되었습니다!');
      console.log('📝 이제 시급 관리 페이지에서 데이터를 확인할 수 있습니다.');
    } else {
      console.log('\n⚠️  일부 설정이 완료되지 않았습니다.');
      console.log('📝 Supabase Dashboard에서 누락된 SQL을 실행해주세요.');
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  verifyHourlyWages().catch(console.error);
}

module.exports = { verifyHourlyWages };
