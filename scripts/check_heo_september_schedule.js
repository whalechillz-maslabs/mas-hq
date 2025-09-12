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

async function checkHeoSeptemberSchedule() {
  console.log('🔍 허상원 9월 스케줄 확인 중...\n');

  try {
    // 허상원 직원 정보 조회
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .ilike('name', '%허상원%');

    if (employeeError) {
      console.error('❌ 직원 조회 실패:', employeeError);
      return;
    }

    if (!employees || employees.length === 0) {
      console.error('❌ 허상원 직원을 찾을 수 없습니다.');
      return;
    }

    const heoEmployee = employees[0];
    console.log(`👤 직원 정보: ${heoEmployee.name} (ID: ${heoEmployee.id})`);

    // 9월 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .gte('schedule_date', '2025-09-01')
      .lte('schedule_date', '2025-09-30')
      .order('schedule_date', { ascending: true });

    if (scheduleError) {
      console.error('❌ 스케줄 조회 실패:', scheduleError);
      return;
    }

    if (!schedules || schedules.length === 0) {
      console.log('❌ 9월 스케줄이 없습니다.');
      return;
    }

    console.log(`\n📋 9월 스케줄 ${schedules.length}개:\n`);

    // 상태별로 그룹화
    const statusGroups = schedules.reduce((acc, schedule) => {
      const status = schedule.status || 'null';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(schedule);
      return acc;
    }, {});

    // 각 상태별로 출력
    Object.entries(statusGroups).forEach(([status, statusSchedules]) => {
      console.log(`📊 상태: ${status} (${statusSchedules.length}개)`);
      statusSchedules.forEach(schedule => {
        console.log(`   📅 ${schedule.schedule_date} - ${schedule.total_hours || 0}시간`);
        if (schedule.notes) {
          console.log(`      📝 메모: ${schedule.notes}`);
        }
      });
      console.log('');
    });

    // 9월 12일 스케줄 특별 확인
    const sep12Schedule = schedules.find(s => s.schedule_date === '2025-09-12');
    if (sep12Schedule) {
      console.log('🎯 9월 12일 스케줄 상세 정보:');
      console.log(`   ID: ${sep12Schedule.id}`);
      console.log(`   상태: ${sep12Schedule.status || 'null'}`);
      console.log(`   근무시간: ${sep12Schedule.total_hours || 0}시간`);
      console.log(`   메모: ${sep12Schedule.notes || '없음'}`);
      console.log(`   생성일: ${sep12Schedule.created_at}`);
      console.log(`   수정일: ${sep12Schedule.updated_at}`);
    } else {
      console.log('❌ 9월 12일 스케줄이 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkHeoSeptemberSchedule();
