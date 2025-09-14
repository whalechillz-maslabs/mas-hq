const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkDatabaseSchema() {
  console.log('🔍 데이터베이스 스키마 점검 시작...\n');

  try {
    // 1. 모든 테이블 목록 확인
    console.log('1️⃣ 기존 테이블 목록 확인 중...');
    
    const tables = [
      'employees',
      'payslips', 
      'schedules',
      'hourly_wages',
      'attendance',
      'employee_tasks',
      'operation_types',
      'contracts',
      'departments',
      'positions',
      'roles',
      'weekly_settlements',
      'daily_work_records'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          if (error.message.includes('Could not find the table')) {
            missingTables.push(table);
            console.log(`❌ ${table}: 테이블 없음`);
          } else {
            existingTables.push(table);
            console.log(`✅ ${table}: 존재함 (${error.message})`);
          }
        } else {
          existingTables.push(table);
          console.log(`✅ ${table}: 존재함 (${data.length}개 레코드 샘플)`);
        }
      } catch (err) {
        missingTables.push(table);
        console.log(`❌ ${table}: 접근 불가 (${err.message})`);
      }
    }

    console.log(`\n📊 테이블 현황:`);
    console.log(`   ✅ 존재하는 테이블: ${existingTables.length}개`);
    console.log(`   ❌ 없는 테이블: ${missingTables.length}개`);

    // 2. 중복 가능성이 있는 테이블 확인
    console.log('\n2️⃣ 중복 가능성 있는 테이블 확인...');
    
    const potentialDuplicates = [
      { name: 'attendance', alternatives: ['attendances', 'check_ins', 'time_attendance'] },
      { name: 'schedules', alternatives: ['schedule', 'work_schedules', 'employee_schedules'] },
      { name: 'payslips', alternatives: ['payslip', 'salary_slips', 'payroll'] },
      { name: 'employees', alternatives: ['employee', 'staff', 'users'] }
    ];

    for (const check of potentialDuplicates) {
      console.log(`\n🔍 ${check.name} 관련 테이블 확인:`);
      
      // 메인 테이블 확인
      const mainExists = existingTables.includes(check.name);
      console.log(`   ${check.name}: ${mainExists ? '✅ 존재' : '❌ 없음'}`);
      
      // 대안 테이블들 확인
      for (const alt of check.alternatives) {
        try {
          const { data, error } = await supabase
            .from(alt)
            .select('*')
            .limit(1);

          if (!error || !error.message.includes('Could not find the table')) {
            console.log(`   ${alt}: ✅ 존재함 (중복 가능성!)`);
          } else {
            console.log(`   ${alt}: ❌ 없음`);
          }
        } catch (err) {
          console.log(`   ${alt}: ❌ 없음`);
        }
      }
    }

    // 3. 테이블 구조 확인 (존재하는 테이블들)
    console.log('\n3️⃣ 주요 테이블 구조 확인...');
    
    const importantTables = ['employees', 'schedules', 'payslips'];
    
    for (const table of importantTables) {
      if (existingTables.includes(table)) {
        console.log(`\n📋 ${table} 테이블 구조:`);
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

          if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log(`   컬럼 수: ${columns.length}개`);
            console.log(`   컬럼 목록: ${columns.join(', ')}`);
          } else {
            console.log(`   데이터 없음`);
          }
        } catch (err) {
          console.log(`   구조 확인 실패: ${err.message}`);
        }
      }
    }

    // 4. 관계 설정 확인
    console.log('\n4️⃣ 테이블 관계 설정 확인...');
    
    try {
      // employees와 schedules 관계 확인
      const { data: scheduleWithEmployee, error: scheduleError } = await supabase
        .from('schedules')
        .select('*, employees(name, employee_id)')
        .limit(1);

      if (scheduleError) {
        console.log('❌ schedules-employees 관계 오류:', scheduleError.message);
      } else {
        console.log('✅ schedules-employees 관계 정상');
      }
    } catch (err) {
      console.log('❌ 관계 확인 실패:', err.message);
    }

    // 5. 결론 및 권장사항
    console.log('\n🎯 점검 결과 및 권장사항:');
    console.log('='.repeat(50));
    
    if (missingTables.includes('attendance')) {
      console.log('📝 attendance 테이블이 없습니다.');
      console.log('   → 출근 체크 데이터를 저장할 테이블이 필요합니다.');
    }
    
    if (existingTables.includes('schedules') && existingTables.includes('employees')) {
      console.log('✅ 기본 테이블 구조는 정상입니다.');
    }
    
    console.log('\n📋 다음 단계:');
    console.log('1. attendance 테이블 생성');
    console.log('2. 기존 데이터와의 관계 설정');
    console.log('3. 샘플 데이터 생성 및 테스트');

  } catch (error) {
    console.error('❌ 스키마 점검 중 오류 발생:', error);
  }
}

// 스크립트 실행
checkDatabaseSchema();