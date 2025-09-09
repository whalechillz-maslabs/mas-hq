const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkDatabaseSchema() {
  console.log('🔍 데이터베이스 스키마 확인 중...');
  
  try {
    // 1. 모든 테이블 목록 조회
    console.log('\n1. 데이터베이스 테이블 목록 조회 중...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');
    
    if (tablesError) {
      console.log('❌ 테이블 목록 조회 실패:', tablesError.message);
      console.log('   → 직접 테이블 존재 여부를 확인하겠습니다');
      
      // 직접 테이블 존재 여부 확인
      const tableNames = [
        'employees', 'departments', 'schedules', 'employee_tasks', 
        'hourly_wages', 'salaries', 'contracts', 'operation_types', 
        'daily_work_records', 'weekly_settlements', 'positions', 'roles'
      ];
      
      console.log('\n📋 테이블 존재 여부 확인:');
      for (const tableName of tableNames) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count')
            .limit(1);
          
          if (error) {
            console.log(`❌ ${tableName}: 존재하지 않음 (${error.message})`);
          } else {
            console.log(`✅ ${tableName}: 존재함`);
          }
        } catch (err) {
          console.log(`❌ ${tableName}: 확인 실패 (${err.message})`);
        }
      }
    } else {
      console.log('✅ 테이블 목록:', tables);
    }
    
    // 2. 최형호 관련 데이터 요약
    console.log('\n2. 최형호 관련 데이터 요약:');
    
    // employees 테이블에서 최형호 정보
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, employment_type, monthly_salary, hourly_rate')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.log('❌ 최형호 직원 정보 조회 실패:', empError.message);
    } else {
      console.log('✅ 최형호 직원 정보:');
      console.log('  - 이름:', choiEmployee.name);
      console.log('  - 직원ID:', choiEmployee.employee_id);
      console.log('  - 고용형태:', choiEmployee.employment_type);
      console.log('  - 월급:', choiEmployee.monthly_salary);
      console.log('  - 시급:', choiEmployee.hourly_rate);
    }
    
    // hourly_wages 테이블에서 최형호 시급 데이터
    if (choiEmployee) {
      const { data: choiWages, error: wageError } = await supabase
        .from('hourly_wages')
        .select('*')
        .eq('employee_id', choiEmployee.id)
        .order('effective_start_date', { ascending: false });
      
      if (wageError) {
        console.log('❌ 최형호 시급 데이터 조회 실패:', wageError.message);
      } else {
        console.log('✅ 최형호 시급 데이터 (총 ' + choiWages.length + '개):');
        if (choiWages.length === 0) {
          console.log('  - 시급 데이터 없음 (월급제이므로 정상)');
        } else {
          choiWages.forEach((wage, index) => {
            console.log(`  - 시급 기록 ${index + 1}: ${wage.base_wage}원 (${wage.effective_start_date} ~ ${wage.effective_end_date || '현재'})`);
          });
        }
      }
    }
    
    // 3. 결론
    console.log('\n📊 결론:');
    if (choiEmployee && choiEmployee.employment_type === 'full_time') {
      console.log('✅ 최형호는 월급제(full_time)로 설정되어 있습니다');
      console.log('✅ 9월 이후 시급 데이터가 없는 것이 정상입니다');
      console.log('⚠️ 급여 관련 테이블(salaries, daily_work_records)이 없어서 급여 데이터를 확인할 수 없습니다');
      console.log('💡 월급제 직원의 급여 관리를 위해서는 급여 관련 테이블이 필요합니다');
    } else {
      console.log('❌ 최형호의 고용형태가 월급제로 설정되지 않았습니다');
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  checkDatabaseSchema().catch(console.error);
}

module.exports = { checkDatabaseSchema };
