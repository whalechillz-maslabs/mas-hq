const { createClient } = require('@supabase/supabase-js');

// 로컬 Supabase 설정
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function checkOPKPISystem() {
  console.log('🔍 OP KPI 시스템 상태 확인 중...\n');

  try {
    // 1. OP 업무 유형 확인
    console.log('📋 1. OP 업무 유형 확인:');
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
        console.log(`   ${op.code}: ${op.name} (${op.points}점) - ${op.description}`);
        console.log(`   대상 직급: ${op.target_roles?.join(', ') || '없음'}`);
        console.log('');
      });
    }

    // 2. daily_performance_records 테이블 확인
    console.log('📊 2. daily_performance_records 테이블 확인:');
    const { data: records, error: recordsError } = await supabase
      .from('daily_performance_records')
      .select('*')
      .limit(5);

    if (recordsError) {
      console.error('❌ daily_performance_records 조회 오류:', recordsError);
    } else {
      console.log(`✅ daily_performance_records 테이블 정상 (기록 ${records.length}개)`);
    }

    // 3. 뷰 확인
    console.log('👁️ 3. 성과 요약 뷰 확인:');
    const { data: summary, error: summaryError } = await supabase
      .from('daily_performance_summary')
      .select('*')
      .limit(3);

    if (summaryError) {
      console.error('❌ daily_performance_summary 뷰 조회 오류:', summaryError);
    } else {
      console.log(`✅ daily_performance_summary 뷰 정상 (요약 ${summary.length}개)`);
    }

    // 4. 팀 성과 요약 뷰 확인
    console.log('👥 4. 팀 성과 요약 뷰 확인:');
    const { data: teamSummary, error: teamError } = await supabase
      .from('team_performance_summary')
      .select('*')
      .limit(3);

    if (teamError) {
      console.error('❌ team_performance_summary 뷰 조회 오류:', teamError);
    } else {
      console.log(`✅ team_performance_summary 뷰 정상 (팀 요약 ${teamSummary.length}개)`);
    }

    // 5. 직원 정보 확인
    console.log('👤 5. 직원 정보 확인:');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, department_id, role_id')
      .eq('status', 'active')
      .limit(5);

    if (empError) {
      console.error('❌ 직원 정보 조회 오류:', empError);
    } else {
      console.log(`✅ 활성 직원 ${employees.length}명 발견`);
      employees.forEach(emp => {
        console.log(`   ${emp.employee_id}: ${emp.name}`);
      });
    }

    console.log('\n🎉 OP KPI 시스템 상태 확인 완료!');

  } catch (error) {
    console.error('❌ 시스템 확인 중 오류 발생:', error);
  }
}

checkOPKPISystem();
