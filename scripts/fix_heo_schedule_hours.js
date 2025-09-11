const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 시간 계산 함수
function calculateHours(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  // 종료 시간이 시작 시간보다 작으면 다음날로 간주
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 10) / 10; // 소수점 첫째자리까지
}

async function fixHeoScheduleHours() {
  console.log('=== 허상원 스케줄 시간 계산 수정 ===');
  
  // 허상원 직원 정보 확인
  const { data: heo, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('name', '허상원')
    .single();
    
  if (empError) {
    console.error('허상원 직원 정보 조회 실패:', empError);
    return;
  }
  
  // 8월 스케줄 확인
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', heo.id)
    .gte('schedule_date', '2025-08-01')
    .lte('schedule_date', '2025-08-31')
    .order('schedule_date');
    
  if (scheduleError) {
    console.error('스케줄 조회 실패:', scheduleError);
    return;
  }
  
  console.log(`수정할 스케줄 수: ${schedules.length}개`);
  
  // 각 스케줄의 시간 계산 및 업데이트
  for (const schedule of schedules) {
    const calculatedHours = calculateHours(schedule.scheduled_start, schedule.scheduled_end);
    
    console.log(`${schedule.schedule_date}: ${schedule.scheduled_start} ~ ${schedule.scheduled_end} = ${calculatedHours}시간`);
    
    // total_hours 업데이트
    const { error: updateError } = await supabase
      .from('schedules')
      .update({ total_hours: calculatedHours })
      .eq('id', schedule.id);
      
    if (updateError) {
      console.error(`스케줄 ${schedule.id} 업데이트 실패:`, updateError);
    } else {
      console.log(`✅ ${schedule.schedule_date} 스케줄 시간 업데이트 완료`);
    }
  }
  
  console.log('\n=== 수정 완료 ===');
}

fixHeoScheduleHours().catch(console.error);
