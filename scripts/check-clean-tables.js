const { createClient } = require('@supabase/supabase-js');

// 로컬 Supabase 설정
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function checkCleanTables() {
  console.log('🔍 정리된 테이블 구조 확인 중...\n');

  try {
    // 1. 핵심 테이블 확인
    console.log('📋 1. 핵심 테이블 확인:');
    const coreTables = [
      'departments',
      'roles', 
      'employees',
      'schedules',
      'operation_types',
      'daily_performance_records',
      'employee_tasks'
    ];

    for (const tableName of coreTables) {
      const { data: records, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${tableName}: 조회 오류`);
      } else {
        console.log(`   ✅ ${tableName}: 정상`);
      }
    }

    // 2. 뷰 확인
    console.log('\n📋 2. 뷰 확인:');
    const views = [
      'daily_performance_summary',
      'team_performance_summary'
    ];

    for (const viewName of views) {
      const { data: records, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${viewName}: 조회 오류`);
      } else {
        console.log(`   ✅ ${viewName}: 정상`);
      }
    }

    // 3. OP 업무 유형 확인
    console.log('\n📋 3. OP 업무 유형 확인:');
    const { data: opTypes, error: opError } = await supabase
      .from('operation_types')
      .select('*')
      .like('code', 'OP%')
      .eq('is_active', true)
      .order('code');

    if (opError) {
      console.error('❌ OP 업무 유형 조회 오류:', opError);
    } else {
      console.log(`✅ OP 업무 유형 ${opTypes.length}개 발견:`);
      opTypes.forEach(op => {
        console.log(`   ${op.code}: ${op.name} (${op.points}점)`);
      });
    }

    // 4. 직원 정보 확인
    console.log('\n📋 4. 직원 정보 확인:');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, department_id, role_id')
      .eq('status', 'active');

    if (empError) {
      console.error('❌ 직원 정보 조회 오류:', empError);
    } else {
      console.log(`✅ 활성 직원 ${employees.length}명:`);
      employees.forEach(emp => {
        console.log(`   ${emp.employee_id}: ${emp.name}`);
      });
    }

    console.log('\n🎉 테이블 정리 완료! 시스템이 단순화되었습니다.');

  } catch (error) {
    console.error('❌ 시스템 확인 중 오류 발생:', error);
  }
}

checkCleanTables();
