const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNaSujinAttendance() {
  console.log('🔧 나수진 출근 데이터 수정 시작...\n');

  try {
    // 1. 나수진 직원 정보 조회
    console.log('1️⃣ 나수진 직원 정보 조회...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .ilike('name', '%나수진%');

    if (empError || !employees || employees.length === 0) {
      console.error('❌ 나수진 직원을 찾을 수 없습니다:', empError?.message);
      return;
    }

    const naSujin = employees[0];
    console.log('✅ 나수진 직원 정보:', naSujin);

    // 2. 2025-09-19 나수진 스케줄 조회
    console.log('\n2️⃣ 2025-09-19 나수진 스케줄 조회...');
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', naSujin.id)
      .eq('schedule_date', '2025-09-19')
      .order('scheduled_start');

    if (scheduleError) {
      console.error('❌ 스케줄 조회 실패:', scheduleError.message);
      return;
    }

    console.log(`✅ ${schedules.length}개 스케줄 발견:`);
    schedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
      console.log(`     actual_start: ${schedule.actual_start}`);
      console.log(`     actual_end: ${schedule.actual_end}`);
    });

    // 3. 잘못된 데이터 확인
    console.log('\n3️⃣ 잘못된 데이터 확인...');
    const wrongSchedules = schedules.filter(s => 
      s.actual_start === '00:00:00' || s.actual_end === '00:30:00'
    );

    if (wrongSchedules.length === 0) {
      console.log('✅ 잘못된 데이터가 없습니다.');
      return;
    }

    console.log(`❌ ${wrongSchedules.length}개 잘못된 스케줄 발견:`);
    wrongSchedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
      console.log(`     잘못된 actual_start: ${schedule.actual_start}`);
      console.log(`     잘못된 actual_end: ${schedule.actual_end}`);
    });

    // 4. 올바른 시간으로 수정
    console.log('\n4️⃣ 올바른 시간으로 수정...');
    
    for (const schedule of wrongSchedules) {
      // 스케줄 시간을 ISO 형식으로 변환
      const correctStartTime = new Date(`2025-09-19T${schedule.scheduled_start}:00`).toISOString();
      const correctEndTime = new Date(`2025-09-19T${schedule.scheduled_end}:00`).toISOString();

      console.log(`수정 중: ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
      console.log(`  올바른 actual_start: ${correctStartTime}`);
      console.log(`  올바른 actual_end: ${correctEndTime}`);

      const { error: updateError } = await supabase
        .from('schedules')
        .update({
          actual_start: correctStartTime,
          actual_end: correctEndTime,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id);

      if (updateError) {
        console.error(`❌ 스케줄 ${schedule.id} 수정 실패:`, updateError.message);
      } else {
        console.log(`✅ 스케줄 ${schedule.id} 수정 완료`);
      }
    }

    // 5. attendance 테이블도 수정
    console.log('\n5️⃣ attendance 테이블 수정...');
    
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', naSujin.id)
      .eq('date', '2025-09-19');

    if (attendanceError) {
      console.error('❌ attendance 조회 실패:', attendanceError.message);
    } else if (attendance && attendance.length > 0) {
      const att = attendance[0];
      console.log('현재 attendance 데이터:', att);

      // 올바른 시간으로 수정 (첫 번째 스케줄 시간 사용)
      const firstSchedule = schedules[0];
      const correctCheckIn = firstSchedule.scheduled_start;
      const correctCheckOut = schedules[schedules.length - 1].scheduled_end;

      const { error: updateAttendanceError } = await supabase
        .from('attendance')
        .update({
          check_in_time: correctCheckIn,
          check_out_time: correctCheckOut,
          updated_at: new Date().toISOString()
        })
        .eq('id', att.id);

      if (updateAttendanceError) {
        console.error('❌ attendance 수정 실패:', updateAttendanceError.message);
      } else {
        console.log('✅ attendance 수정 완료');
        console.log(`  check_in_time: ${correctCheckIn}`);
        console.log(`  check_out_time: ${correctCheckOut}`);
      }
    } else {
      console.log('⚠️ attendance 데이터가 없습니다.');
    }

    console.log('\n🎉 나수진 출근 데이터 수정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixNaSujinAttendance();
