const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 시간 계산 함수
function calculateHours(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 10) / 10;
}

async function fixSeptember5thSchedule() {
  console.log('=== 9월 5일 스케줄 시간 계산 수정 ===');
  
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
  
  // 9월 5일 스케줄 확인
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', heo.id)
    .eq('schedule_date', '2025-09-05');
    
  if (scheduleError) {
    console.error('스케줄 조회 실패:', scheduleError);
    return;
  }
  
  console.log(`9월 5일 스케줄 수: ${schedules.length}개`);
  
  for (const schedule of schedules) {
    const calculatedHours = calculateHours(schedule.scheduled_start, schedule.scheduled_end);
    
    console.log(`스케줄: ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
    console.log(`계산된 시간: ${calculatedHours}시간`);
    console.log(`현재 시간: ${schedule.total_hours}시간`);
    
    if (schedule.total_hours !== calculatedHours) {
      // total_hours 업데이트
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ total_hours: calculatedHours })
        .eq('id', schedule.id);
        
      if (updateError) {
        console.error(`스케줄 ${schedule.id} 업데이트 실패:`, updateError);
      } else {
        console.log(`✅ ${schedule.schedule_date} 스케줄 시간 업데이트 완료: ${calculatedHours}시간`);
      }
    } else {
      console.log(`✅ 시간이 이미 올바르게 설정됨`);
    }
  }
  
  console.log('\n=== 9월 5일 스케줄 수정 완료 ===');
}

fixSeptember5thSchedule().catch(console.error);

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 시간 계산 함수
function calculateHours(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 10) / 10;
}

async function fixSeptember5thSchedule() {
  console.log('=== 9월 5일 스케줄 시간 계산 수정 ===');
  
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
  
  // 9월 5일 스케줄 확인
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', heo.id)
    .eq('schedule_date', '2025-09-05');
    
  if (scheduleError) {
    console.error('스케줄 조회 실패:', scheduleError);
    return;
  }
  
  console.log(`9월 5일 스케줄 수: ${schedules.length}개`);
  
  for (const schedule of schedules) {
    const calculatedHours = calculateHours(schedule.scheduled_start, schedule.scheduled_end);
    
    console.log(`스케줄: ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
    console.log(`계산된 시간: ${calculatedHours}시간`);
    console.log(`현재 시간: ${schedule.total_hours}시간`);
    
    if (schedule.total_hours !== calculatedHours) {
      // total_hours 업데이트
      const { error: updateError } = await supabase
        .from('schedules')
        .update({ total_hours: calculatedHours })
        .eq('id', schedule.id);
        
      if (updateError) {
        console.error(`스케줄 ${schedule.id} 업데이트 실패:`, updateError);
      } else {
        console.log(`✅ ${schedule.schedule_date} 스케줄 시간 업데이트 완료: ${calculatedHours}시간`);
      }
    } else {
      console.log(`✅ 시간이 이미 올바르게 설정됨`);
    }
  }
  
  console.log('\n=== 9월 5일 스케줄 수정 완료 ===');
}

fixSeptember5thSchedule().catch(console.error);
