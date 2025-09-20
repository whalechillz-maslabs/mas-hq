const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNaSujinFirstSchedule() {
  console.log('🔧 나수진 첫 번째 스케줄 수정 시작...\n');

  try {
    // 1. 나수진 직원 정보 조회
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

    // 2. 첫 번째 스케줄 (09:00-09:30) 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', naSujin.id)
      .eq('schedule_date', '2025-09-19')
      .eq('scheduled_start', '09:00:00')
      .eq('scheduled_end', '09:30:00');

    if (scheduleError || !schedules || schedules.length === 0) {
      console.error('❌ 첫 번째 스케줄을 찾을 수 없습니다:', scheduleError?.message);
      return;
    }

    const firstSchedule = schedules[0];
    console.log('현재 첫 번째 스케줄:', firstSchedule);
    console.log(`잘못된 actual_start: ${firstSchedule.actual_start}`);
    console.log(`잘못된 actual_end: ${firstSchedule.actual_end}`);

    // 3. 올바른 시간으로 수정
    const correctStartTime = new Date('2025-09-19T09:00:00').toISOString();
    const correctEndTime = new Date('2025-09-19T09:30:00').toISOString();

    console.log('\n수정할 시간:');
    console.log(`올바른 actual_start: ${correctStartTime}`);
    console.log(`올바른 actual_end: ${correctEndTime}`);

    const { error: updateError } = await supabase
      .from('schedules')
      .update({
        actual_start: correctStartTime,
        actual_end: correctEndTime,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', firstSchedule.id);

    if (updateError) {
      console.error('❌ 스케줄 수정 실패:', updateError.message);
    } else {
      console.log('✅ 첫 번째 스케줄 수정 완료!');
    }

    // 4. attendance 테이블도 확인하고 수정
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', naSujin.id)
      .eq('date', '2025-09-19');

    if (attendanceError) {
      console.error('❌ attendance 조회 실패:', attendanceError.message);
    } else if (attendance && attendance.length > 0) {
      const att = attendance[0];
      console.log('\n현재 attendance 데이터:', att);

      // check_in_time이 00:00:00이면 09:00:00으로 수정
      if (att.check_in_time === '00:00:00') {
        const { error: updateAttendanceError } = await supabase
          .from('attendance')
          .update({
            check_in_time: '09:00:00',
            updated_at: new Date().toISOString()
          })
          .eq('id', att.id);

        if (updateAttendanceError) {
          console.error('❌ attendance check_in_time 수정 실패:', updateAttendanceError.message);
        } else {
          console.log('✅ attendance check_in_time 수정 완료 (09:00:00)');
        }
      }

      // check_out_time이 00:30:00이면 16:00:55로 수정 (다른 스케줄들과 일치)
      if (att.check_out_time === '00:30:00') {
        const { error: updateAttendanceError } = await supabase
          .from('attendance')
          .update({
            check_out_time: '16:00:55',
            updated_at: new Date().toISOString()
          })
          .eq('id', att.id);

        if (updateAttendanceError) {
          console.error('❌ attendance check_out_time 수정 실패:', updateAttendanceError.message);
        } else {
          console.log('✅ attendance check_out_time 수정 완료 (16:00:55)');
        }
      }
    }

    console.log('\n🎉 나수진 첫 번째 스케줄 수정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixNaSujinFirstSchedule();
