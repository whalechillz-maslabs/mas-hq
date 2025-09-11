const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function deleteHeoSchedules() {
  console.log('=== 허상원 기존 스케줄 데이터 삭제 ===');
  
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
  
  console.log('허상원 정보:', {
    name: heo.name,
    employee_id: heo.employee_id,
    id: heo.id
  });
  
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
  
  console.log(`\n삭제할 스케줄 수: ${schedules.length}개`);
  
  // 각 스케줄 삭제
  for (const schedule of schedules) {
    console.log(`삭제 중: ${schedule.schedule_date} ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
    
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', schedule.id);
      
    if (deleteError) {
      console.error(`스케줄 ${schedule.id} 삭제 실패:`, deleteError);
    } else {
      console.log(`✅ ${schedule.schedule_date} 스케줄 삭제 완료`);
    }
  }
  
  console.log('\n=== 허상원 기존 스케줄 삭제 완료 ===');
}

deleteHeoSchedules().catch(console.error);

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function deleteHeoSchedules() {
  console.log('=== 허상원 기존 스케줄 데이터 삭제 ===');
  
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
  
  console.log('허상원 정보:', {
    name: heo.name,
    employee_id: heo.employee_id,
    id: heo.id
  });
  
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
  
  console.log(`\n삭제할 스케줄 수: ${schedules.length}개`);
  
  // 각 스케줄 삭제
  for (const schedule of schedules) {
    console.log(`삭제 중: ${schedule.schedule_date} ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
    
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', schedule.id);
      
    if (deleteError) {
      console.error(`스케줄 ${schedule.id} 삭제 실패:`, deleteError);
    } else {
      console.log(`✅ ${schedule.schedule_date} 스케줄 삭제 완료`);
    }
  }
  
  console.log('\n=== 허상원 기존 스케줄 삭제 완료 ===');
}

deleteHeoSchedules().catch(console.error);
