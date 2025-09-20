const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugChoiAttendance() {
  console.log('🔍 최형호 9월 19일 출근 데이터 분석...\n');

  try {
    // 1. 최형호 직원 정보 확인
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();

    if (empError) {
      console.error('❌ 직원 정보 조회 오류:', empError);
      return;
    }

    console.log('👤 최형호 직원 정보:');
    console.log('  - ID:', employee.id);
    console.log('  - 이름:', employee.name);
    console.log('  - 직원번호:', employee.employee_id);
    console.log('');

    // 2. 9월 19일 스케줄 확인
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('schedule_date', '2025-09-19')
      .order('scheduled_start');

    if (scheduleError) {
      console.error('❌ 스케줄 조회 오류:', scheduleError);
      return;
    }

    console.log('📅 9월 19일 스케줄:');
    schedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ID: ${schedule.id}`);
      console.log(`     스케줄: ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
      console.log(`     상태: ${schedule.status}`);
      console.log(`     실제 시작: ${schedule.actual_start || 'null'}`);
      console.log(`     실제 종료: ${schedule.actual_end || 'null'}`);
      console.log('');
    });

    // 3. 9월 19일 출근 기록 확인
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', '2025-09-19')
      .order('check_in_time');

    if (attendanceError) {
      console.error('❌ 출근 기록 조회 오류:', attendanceError);
      return;
    }

    console.log('⏰ 9월 19일 출근 기록:');
    if (attendance.length === 0) {
      console.log('  - 출근 기록이 없습니다.');
    } else {
      attendance.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id}`);
        console.log(`     출근: ${record.check_in_time || 'null'}`);
        console.log(`     퇴근: ${record.check_out_time || 'null'}`);
        console.log(`     휴식 시작: ${record.break_start_time || 'null'}`);
        console.log(`     휴식 종료: ${record.break_end_time || 'null'}`);
        console.log('');
      });
    }

    // 4. 문제 분석
    console.log('🔍 문제 분석:');
    
    if (schedules.length > 0 && attendance.length > 0) {
      const firstSchedule = schedules[0];
      const firstAttendance = attendance[0];
      
      console.log('  - 스케줄 시작 시간:', firstSchedule.scheduled_start);
      console.log('  - 실제 출근 시간:', firstAttendance.check_in_time);
      
      if (firstAttendance.check_in_time) {
        const scheduleStart = new Date(`2025-09-19T${firstSchedule.scheduled_start}`);
        const actualStart = new Date(firstAttendance.check_in_time);
        
        console.log('  - 스케줄 시작:', scheduleStart.toLocaleString());
        console.log('  - 실제 출근:', actualStart.toLocaleString());
        
        if (actualStart > scheduleStart) {
          const diffMinutes = Math.round((actualStart - scheduleStart) / (1000 * 60));
          console.log(`  - 지각 시간: ${diffMinutes}분`);
        }
      }
    }

    // 5. 상태 불일치 확인
    console.log('\n⚠️  상태 불일치 확인:');
    schedules.forEach((schedule, index) => {
      const hasActualStart = schedule.actual_start !== null;
      const hasActualEnd = schedule.actual_end !== null;
      
      console.log(`  스케줄 ${index + 1}:`);
      console.log(`    - 상태: ${schedule.status}`);
      console.log(`    - 실제 시작 있음: ${hasActualStart}`);
      console.log(`    - 실제 종료 있음: ${hasActualEnd}`);
      
      if (schedule.status === '근무중' && hasActualEnd) {
        console.log(`    ❌ 문제: 상태가 '근무중'인데 실제 종료 시간이 있음`);
      }
      if (schedule.status === '완료' && !hasActualEnd) {
        console.log(`    ❌ 문제: 상태가 '완료'인데 실제 종료 시간이 없음`);
      }
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

debugChoiAttendance();
