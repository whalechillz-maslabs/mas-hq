const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function insertChoiWages() {
  console.log('=== 최형호 시급 데이터 입력 ===');
  
  try {
    // 1. 최형호 정보 확인
    console.log('\n1. 최형호 정보 확인 중...');
    const { data: choiEmployee, error: choiError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호')
      .single();
    
    if (choiError) {
      console.log('❌ 최형호 정보 확인 실패:', choiError);
      return;
    }
    
    console.log('✅ 최형호 정보 확인:', {
      id: choiEmployee.id,
      name: choiEmployee.name,
      employee_id: choiEmployee.employee_id
    });
    
    // 2. 시급 데이터 입력
    console.log('\n2. 최형호 시급 데이터 입력 중...');
    
    const wageData = [
      {
        employee_id: choiEmployee.id,
        base_wage: 13000,
        effective_start_date: '2025-08-01',
        effective_end_date: '2025-08-04',
        status: 'active'
      },
      {
        employee_id: choiEmployee.id,
        base_wage: 12000,
        effective_start_date: '2025-08-08',
        effective_end_date: '2025-08-29',
        status: 'active'
      }
    ];
    
    const { data: insertData, error: insertError } = await supabase
      .from('hourly_wages')
      .insert(wageData)
      .select();
    
    if (insertError) {
      console.log('❌ 시급 데이터 삽입 실패:', insertError);
      return;
    }
    
    console.log('✅ 시급 데이터 삽입 완료:');
    insertData.forEach((wage, index) => {
      console.log(`  ${index + 1}. ${wage.effective_start_date} - ${wage.effective_end_date}: ${wage.base_wage.toLocaleString()}원`);
    });
    
    // 3. 최형호 직원 정보 수정 (9월 1일부터 월급제로 전환)
    console.log('\n3. 최형호 직원 정보 수정 중...');
    
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        monthly_salary: 1680000,
        hourly_rate: null,
        employment_type: 'full_time'
      })
      .eq('id', choiEmployee.id);
    
    if (updateError) {
      console.log('❌ 최형호 직원 정보 수정 실패:', updateError);
    } else {
      console.log('✅ 최형호 직원 정보 수정 완료 (월급제로 전환)');
    }
    
    // 4. 최종 확인
    console.log('\n4. 최종 확인 중...');
    
    // 시급 데이터 확인
    const { data: finalWages, error: wagesError } = await supabase
      .from('hourly_wages')
      .select(`
        id,
        base_wage,
        effective_start_date,
        effective_end_date,
        status,
        employees!inner(name, employee_id)
      `)
      .eq('employees.name', '최형호');
    
    if (wagesError) {
      console.log('❌ 시급 데이터 확인 실패:', wagesError);
    } else {
      console.log('✅ 최형호 시급 데이터:');
      finalWages.forEach((wage, index) => {
        console.log(`  ${index + 1}. ${wage.effective_start_date} - ${wage.effective_end_date}: ${wage.base_wage.toLocaleString()}원 (${wage.status})`);
      });
    }
    
    // 직원 정보 확인
    const { data: finalEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('name, employee_id, employment_type, hourly_rate, monthly_salary')
      .eq('name', '최형호')
      .single();
    
    if (employeeError) {
      console.log('❌ 직원 정보 확인 실패:', employeeError);
    } else {
      console.log('✅ 최형호 직원 정보:');
      console.log(`  이름: ${finalEmployee.name}`);
      console.log(`  직원 ID: ${finalEmployee.employee_id}`);
      console.log(`  고용 형태: ${finalEmployee.employment_type}`);
      console.log(`  시급: ${finalEmployee.hourly_rate?.toLocaleString() || 'null'}원`);
      console.log(`  월급: ${finalEmployee.monthly_salary?.toLocaleString() || 'null'}원`);
    }
    
    console.log('\n🎉 hourly_wages 시스템 구축 완료!');
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  insertChoiWages().catch(console.error);
}

module.exports = { insertChoiWages };
