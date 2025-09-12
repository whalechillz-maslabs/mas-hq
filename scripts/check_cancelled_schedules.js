const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    // 따옴표와 개행 문자 제거
    envVars[key.trim()] = value.trim().replace(/['"]/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCancelledSchedules() {
  console.log('🔍 취소된 스케줄 확인 중...\n');

  try {
    // 취소된 스케줄 조회
    const { data: cancelledSchedules, error } = await supabase
      .from('schedules')
      .select(`
        *,
        employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .eq('status', 'cancelled')
      .order('schedule_date', { ascending: true });

    if (error) {
      console.error('❌ 취소된 스케줄 조회 실패:', error);
      return;
    }

    if (!cancelledSchedules || cancelledSchedules.length === 0) {
      console.log('✅ 취소된 스케줄이 없습니다.');
      return;
    }

    console.log(`📋 취소된 스케줄 ${cancelledSchedules.length}개 발견:\n`);

    // 직원별로 그룹화
    const schedulesByEmployee = cancelledSchedules.reduce((acc, schedule) => {
      const employeeName = schedule.employees?.name || '알 수 없음';
      if (!acc[employeeName]) {
        acc[employeeName] = [];
      }
      acc[employeeName].push(schedule);
      return acc;
    }, {});

    // 각 직원별 취소된 스케줄 출력
    Object.entries(schedulesByEmployee).forEach(([employeeName, schedules]) => {
      console.log(`👤 ${employeeName}:`);
      schedules.forEach(schedule => {
        console.log(`   📅 ${schedule.schedule_date} - ${schedule.total_hours || 0}시간`);
        if (schedule.notes) {
          console.log(`      📝 메모: ${schedule.notes}`);
        }
      });
      console.log('');
    });

    // 처리 옵션 제시
    console.log('🔧 처리 옵션:');
    console.log('1. 취소된 스케줄을 삭제');
    console.log('2. 취소된 스케줄을 다시 승인');
    console.log('3. 취소된 스케줄을 그대로 유지 (급여명세서 생성 시 제외)');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 특정 직원의 취소된 스케줄만 확인
async function checkEmployeeCancelledSchedules(employeeName) {
  console.log(`🔍 ${employeeName}의 취소된 스케줄 확인 중...\n`);

  try {
    // 직원 정보 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', employeeName)
      .single();

    if (employeeError || !employee) {
      console.error(`❌ 직원 '${employeeName}'을 찾을 수 없습니다.`);
      return;
    }

    // 해당 직원의 취소된 스케줄 조회
    const { data: cancelledSchedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('status', 'cancelled')
      .order('schedule_date', { ascending: true });

    if (error) {
      console.error('❌ 취소된 스케줄 조회 실패:', error);
      return;
    }

    if (!cancelledSchedules || cancelledSchedules.length === 0) {
      console.log(`✅ ${employeeName}의 취소된 스케줄이 없습니다.`);
      return;
    }

    console.log(`📋 ${employeeName}의 취소된 스케줄 ${cancelledSchedules.length}개:\n`);

    cancelledSchedules.forEach(schedule => {
      console.log(`📅 ${schedule.schedule_date} - ${schedule.total_hours || 0}시간`);
      if (schedule.notes) {
        console.log(`   📝 메모: ${schedule.notes}`);
      }
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 취소된 스케줄을 삭제하는 함수
async function deleteCancelledSchedules(employeeName = null) {
  console.log('🗑️ 취소된 스케줄 삭제 중...\n');

  try {
    let query = supabase
      .from('schedules')
      .delete()
      .eq('status', 'cancelled');

    if (employeeName) {
      // 특정 직원의 취소된 스케줄만 삭제
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('name', employeeName)
        .single();

      if (employeeError || !employee) {
        console.error(`❌ 직원 '${employeeName}'을 찾을 수 없습니다.`);
        return;
      }

      query = query.eq('employee_id', employee.id);
    }

    const { error } = await query;

    if (error) {
      console.error('❌ 취소된 스케줄 삭제 실패:', error);
      return;
    }

    console.log(`✅ 취소된 스케줄이 삭제되었습니다.${employeeName ? ` (${employeeName})` : ''}`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 취소된 스케줄을 다시 승인하는 함수
async function approveCancelledSchedules(employeeName = null) {
  console.log('✅ 취소된 스케줄을 승인으로 변경 중...\n');

  try {
    let query = supabase
      .from('schedules')
      .update({ status: 'approved' })
      .eq('status', 'cancelled');

    if (employeeName) {
      // 특정 직원의 취소된 스케줄만 승인
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('name', employeeName)
        .single();

      if (employeeError || !employee) {
        console.error(`❌ 직원 '${employeeName}'을 찾을 수 없습니다.`);
        return;
      }

      query = query.eq('employee_id', employee.id);
    }

    const { error } = await query;

    if (error) {
      console.error('❌ 취소된 스케줄 승인 실패:', error);
      return;
    }

    console.log(`✅ 취소된 스케줄이 승인으로 변경되었습니다.${employeeName ? ` (${employeeName})` : ''}`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 명령행 인수 처리
const args = process.argv.slice(2);
const command = args[0];
const employeeName = args[1];

switch (command) {
  case 'check':
    if (employeeName) {
      checkEmployeeCancelledSchedules(employeeName);
    } else {
      checkCancelledSchedules();
    }
    break;
  case 'delete':
    deleteCancelledSchedules(employeeName);
    break;
  case 'approve':
    approveCancelledSchedules(employeeName);
    break;
  default:
    console.log('사용법:');
    console.log('  node check_cancelled_schedules.js check [직원명]     - 취소된 스케줄 확인');
    console.log('  node check_cancelled_schedules.js delete [직원명]   - 취소된 스케줄 삭제');
    console.log('  node check_cancelled_schedules.js approve [직원명]  - 취소된 스케줄 승인');
    console.log('');
    console.log('예시:');
    console.log('  node check_cancelled_schedules.js check 허상원');
    console.log('  node check_cancelled_schedules.js delete 허상원');
    console.log('  node check_cancelled_schedules.js approve 허상원');
}
