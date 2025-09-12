const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (실제 값으로 교체)
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NzQ4NzQsImV4cCI6MjA1MjA1MDg3NH0.8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8QJ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSampleHourlyWages() {
  try {
    console.log('🚀 샘플 시급 데이터 생성 시작');
    
    // 1. 직원 목록 조회
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .order('name');
    
    if (employeesError) {
      console.error('❌ 직원 목록 조회 실패:', employeesError);
      return;
    }
    
    console.log('👥 직원 목록:', employees);
    
    if (employees.length === 0) {
      console.log('❌ 직원이 없습니다. 먼저 직원을 생성해주세요.');
      return;
    }
    
    // 2. 기존 시급 데이터 삭제 (선택사항)
    const { error: deleteError } = await supabase
      .from('hourly_wages')
      .delete()
      .neq('id', 0); // 모든 데이터 삭제
    
    if (deleteError) {
      console.log('⚠️ 기존 데이터 삭제 실패 (무시):', deleteError.message);
    } else {
      console.log('✅ 기존 시급 데이터 삭제 완료');
    }
    
    // 3. 샘플 시급 데이터 생성
    const sampleWages = [];
    
    for (const employee of employees) {
      // 기본 시급 데이터
      sampleWages.push({
        employee_id: employee.id,
        base_wage: 12000,
        overtime_multiplier: 1.5,
        night_shift_multiplier: 1.3,
        holiday_multiplier: 2.0,
        effective_date: '2025-01-01',
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // 허상원의 경우 추가 시급 데이터 (2025-09-01부터)
      if (employee.name.includes('허상원') || employee.name.includes('상원')) {
        sampleWages.push({
          employee_id: employee.id,
          base_wage: 13000,
          overtime_multiplier: 1.5,
          night_shift_multiplier: 1.3,
          holiday_multiplier: 2.0,
          effective_date: '2025-09-01',
          end_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    console.log('📝 생성할 시급 데이터:', sampleWages);
    
    // 4. 시급 데이터 삽입
    const { data: insertedWages, error: insertError } = await supabase
      .from('hourly_wages')
      .insert(sampleWages)
      .select();
    
    if (insertError) {
      console.error('❌ 시급 데이터 삽입 실패:', insertError);
      return;
    }
    
    console.log('✅ 시급 데이터 삽입 성공:', insertedWages);
    
    // 5. 생성된 데이터 확인
    const { data: allWages, error: selectError } = await supabase
      .from('hourly_wages')
      .select(`
        *,
        employees!inner(name, employee_id)
      `)
      .order('effective_date', { ascending: false });
    
    if (selectError) {
      console.error('❌ 시급 데이터 조회 실패:', selectError);
      return;
    }
    
    console.log('📊 생성된 시급 데이터:');
    allWages.forEach(wage => {
      console.log(`  - ${wage.employees.name} (${wage.employees.employee_id}): ${wage.base_wage}원, ${wage.effective_date}`);
    });
    
    console.log('🎉 샘플 시급 데이터 생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// Supabase 설정 확인
console.log('🔧 Supabase 설정:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '설정됨' : '설정되지 않음');

createSampleHourlyWages();
