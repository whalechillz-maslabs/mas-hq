const { createClient } = require('@supabase/supabase-js');

// 로컬 Supabase 설정
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function checkCurrentTables() {
  console.log('🔍 현재 데이터베이스 테이블 및 뷰 확인 중...\n');

  try {
    // 1. 모든 테이블 목록 조회
    console.log('📋 1. 테이블 목록:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ 테이블 목록 조회 오류:', tablesError);
    } else {
      console.log(`✅ 총 ${tables.length}개 테이블/뷰 발견:`);
      tables.forEach(table => {
        console.log(`   ${table.table_type === 'VIEW' ? '👁️' : '📊'} ${table.table_name} (${table.table_type})`);
      });
    }

    // 2. OP 관련 테이블 상세 확인
    console.log('\n📋 2. OP 관련 테이블 상세:');
    const opTables = ['operation_types', 'daily_performance_records', 'employee_tasks'];
    
    for (const tableName of opTables) {
      const { data: records, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);
      
      if (error) {
        console.log(`   ❌ ${tableName}: 조회 오류`);
      } else {
        console.log(`   ✅ ${tableName}: ${records.length}개 레코드`);
      }
    }

    // 3. 중복/불필요 테이블 식별
    console.log('\n📋 3. 중복/불필요 테이블 분석:');
    const unnecessaryTables = [
      'audit_logs',           // 감사 로그 (기본 기능에 불필요)
      'contracts',            // 계약서 (현재 사용 안함)
      'documents',            // 문서 (현재 사용 안함)
      'employee_details',     // 직원 상세 (employees와 중복)
      'monthly_attendance_summary', // 월간 출근 요약 (schedules로 대체)
      'notifications',        // 알림 (현재 사용 안함)
      'operation_type_permissions', // 업무 유형 권한 (단순화로 불필요)
      'operation_types_backup', // 백업 테이블 (불필요)
      'performance_metrics',  // 성과 지표 (daily_performance_records로 대체)
      'salaries',             // 급여 (현재 사용 안함)
      'sessions',             // 세션 (Supabase Auth로 대체)
      'task_performance_summary' // 작업 성과 요약 (daily_performance_summary로 대체)
    ];

    console.log('삭제 대상 테이블:');
    unnecessaryTables.forEach(table => {
      console.log(`   🗑️ ${table}`);
    });

    // 4. 핵심 테이블 확인
    console.log('\n📋 4. 핵심 테이블 (유지):');
    const coreTables = [
      'departments',          // 부서 정보
      'roles',               // 직급 정보
      'employees',           // 직원 정보
      'schedules',           // 근무 스케줄
      'operation_types',     // 업무 유형 (OP1~OP10)
      'daily_performance_records', // 일일 성과 기록
      'daily_performance_summary', // 일일 성과 요약 뷰
      'team_performance_summary'   // 팀 성과 요약 뷰
    ];

    coreTables.forEach(table => {
      console.log(`   ✅ ${table}`);
    });

    console.log('\n🎉 테이블 구조 분석 완료!');

  } catch (error) {
    console.error('❌ 시스템 확인 중 오류 발생:', error);
  }
}

checkCurrentTables();
