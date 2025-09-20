const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function autoUpdateScheduleStatus() {
  console.log('=== 자동 스케줄 상태 업데이트 ===');
  
  try {
    // 1. 오늘 날짜 계산 (한국 시간 기준)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const today = koreaTime.toISOString().split('T')[0];
    const currentTime = koreaTime.toISOString().split('T')[1].split('.')[0];
    
    console.log('오늘 날짜:', today);
    console.log('현재 시간:', currentTime);
    
    // 2. 오늘 스케줄 중에서 상태가 'pending'인 것들 조회
    const { data: pendingSchedules, error: pendingError } = await supabase
      .from('schedules')
      .select('*')
      .eq('schedule_date', today)
      .eq('status', 'pending')
      .order('scheduled_start');
    
    if (pendingError) {
      console.error('대기 중인 스케줄 조회 실패:', pendingError);
      return;
    }
    
    console.log(`대기 중인 스케줄: ${pendingSchedules.length}개`);
    
    // 3. 각 스케줄의 종료 시간이 지났는지 확인
    for (const schedule of pendingSchedules) {
      const scheduledEnd = schedule.scheduled_end;
      const isTimePassed = currentTime > scheduledEnd;
      
      console.log(`스케줄 ${schedule.id}: ${schedule.scheduled_start} ~ ${scheduledEnd}`);
      console.log(`현재 시간: ${currentTime}, 종료 시간 지남: ${isTimePassed}`);
      
      if (isTimePassed) {
        // 출근 기록이 있는지 확인
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', schedule.employee_id)
          .eq('date', today)
          .single();
        
        if (attendanceError && attendanceError.code !== 'PGRST116') {
          console.error('출근 기록 조회 실패:', attendanceError);
          continue;
        }
        
        if (attendance && attendance.check_in_time) {
          // 출근 기록이 있으면 'completed'로 변경
          const { error: updateError } = await supabase
            .from('schedules')
            .update({
              status: 'completed',
              employee_note: '자동 완료 (출근 기록 있음)'
            })
            .eq('id', schedule.id);
          
          if (updateError) {
            console.error(`스케줄 ${schedule.id} 업데이트 실패:`, updateError);
          } else {
            console.log(`✅ 스케줄 ${schedule.id}를 completed로 변경`);
          }
        } else {
          // 출근 기록이 없으면 'cancelled'로 변경
          const { error: updateError } = await supabase
            .from('schedules')
            .update({
              status: 'cancelled',
              employee_note: '자동 취소 (출근 기록 없음)'
            })
            .eq('id', schedule.id);
          
          if (updateError) {
            console.error(`스케줄 ${schedule.id} 업데이트 실패:`, updateError);
          } else {
            console.log(`❌ 스케줄 ${schedule.id}를 cancelled로 변경`);
          }
        }
      }
    }
    
    // 4. 진행 중인 스케줄 중에서 종료 시간이 지난 것들 처리
    const { data: inProgressSchedules, error: inProgressError } = await supabase
      .from('schedules')
      .select('*')
      .eq('schedule_date', today)
      .eq('status', 'in_progress')
      .order('scheduled_start');
    
    if (inProgressError) {
      console.error('진행 중인 스케줄 조회 실패:', inProgressError);
      return;
    }
    
    console.log(`진행 중인 스케줄: ${inProgressSchedules.length}개`);
    
    for (const schedule of inProgressSchedules) {
      const scheduledEnd = schedule.scheduled_end;
      const isTimePassed = currentTime > scheduledEnd;
      
      if (isTimePassed && !schedule.actual_end) {
        // 종료 시간이 지났고 퇴근 기록이 없으면 자동 퇴근 처리
        const { error: updateError } = await supabase
          .from('schedules')
          .update({
            actual_end: koreaTime.toISOString(),
            status: 'completed',
            employee_note: '자동 퇴근 처리'
          })
          .eq('id', schedule.id);
        
        if (updateError) {
          console.error(`스케줄 ${schedule.id} 자동 퇴근 처리 실패:`, updateError);
        } else {
          console.log(`✅ 스케줄 ${schedule.id} 자동 퇴근 처리 완료`);
        }
      }
    }
    
    console.log('\\n=== 자동 스케줄 상태 업데이트 완료 ===');
    
  } catch (error) {
    console.error('자동 스케줄 상태 업데이트 오류:', error);
  }
}

// 스크립트 실행
autoUpdateScheduleStatus().catch(console.error);
