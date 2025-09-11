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

async function fixHeoSeptemberSchedules() {
  console.log('=== 허상원 9월 첫째 주 스케줄 수정 (점심시간 제외) ===');
  
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
  
  // 8월 31일부터 9월 6일까지 스케줄 확인
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', heo.id)
    .gte('schedule_date', '2025-08-31')
    .lte('schedule_date', '2025-09-06')
    .order('schedule_date');
    
  if (scheduleError) {
    console.error('스케줄 조회 실패:', scheduleError);
    return;
  }
  
  console.log(`수정할 스케줄 수: ${schedules.length}개\n`);
  
  // 점심시간이 포함된 스케줄들을 삭제하고 분리해서 재생성
  const schedulesToDelete = schedules.filter(s => {
    const start = new Date(`2000-01-01T${s.scheduled_start}`);
    const end = new Date(`2000-01-01T${s.scheduled_end}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const lunchStart = new Date(`2000-01-01T12:00:00`);
    const lunchEnd = new Date(`2000-01-01T13:00:00`);
    
    // 점심시간과 겹치는지 확인
    return (start < lunchEnd && end > lunchStart);
  });
  
  console.log(`점심시간 포함 스케줄 삭제 대상: ${schedulesToDelete.length}개`);
  
  // 점심시간 포함 스케줄 삭제
  for (const schedule of schedulesToDelete) {
    console.log(`삭제: ${schedule.schedule_date} ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
    
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', schedule.id);
      
    if (deleteError) {
      console.error(`스케줄 삭제 실패:`, deleteError);
    } else {
      console.log(`✅ 삭제 완료`);
    }
  }
  
  console.log('\n=== 점심시간 제외 스케줄 재생성 ===');
  
  // 9월 첫째 주 스케줄 데이터 (점심시간 제외)
  const septemberSchedules = [
    { date: '2025-09-01', morning: '09:00:00', morningEnd: '12:00:00', afternoon: '13:00:00', afternoonEnd: '17:00:00' },
    { date: '2025-09-02', morning: '09:00:00', morningEnd: '12:00:00', afternoon: '13:00:00', afternoonEnd: '16:30:00' },
    { date: '2025-09-03', morning: '09:00:00', morningEnd: '12:00:00', afternoon: '13:00:00', afternoonEnd: '17:00:00' },
    { date: '2025-09-04', morning: '09:00:00', morningEnd: '12:00:00', afternoon: '13:00:00', afternoonEnd: '17:00:00' }
  ];
  
  for (const scheduleData of septemberSchedules) {
    console.log(`\n📅 ${scheduleData.date}`);
    
    // 오전 스케줄 생성 (9:00 - 12:00)
    const morningSchedule = {
      employee_id: heo.id,
      schedule_date: scheduleData.date,
      scheduled_start: scheduleData.morning,
      scheduled_end: scheduleData.morningEnd,
      status: 'approved',
      employee_note: '오전 근무',
      total_hours: calculateHours(scheduleData.morning, scheduleData.morningEnd),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 오후 스케줄 생성 (13:00 - 종료시간)
    const afternoonSchedule = {
      employee_id: heo.id,
      schedule_date: scheduleData.date,
      scheduled_start: scheduleData.afternoon,
      scheduled_end: scheduleData.afternoonEnd,
      status: 'approved',
      employee_note: '오후 근무',
      total_hours: calculateHours(scheduleData.afternoon, scheduleData.afternoonEnd),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 오전 스케줄 삽입
    const { data: morningData, error: morningError } = await supabase
      .from('schedules')
      .insert(morningSchedule)
      .select()
      .single();
      
    if (morningError) {
      console.error(`오전 스케줄 삽입 실패:`, morningError);
    } else {
      console.log(`  ✅ 오전: ${scheduleData.morning}-${scheduleData.morningEnd} (${morningSchedule.total_hours}시간)`);
    }
    
    // 오후 스케줄 삽입
    const { data: afternoonData, error: afternoonError } = await supabase
      .from('schedules')
      .insert(afternoonSchedule)
      .select()
      .single();
      
    if (afternoonError) {
      console.error(`오후 스케줄 삽입 실패:`, afternoonError);
    } else {
      console.log(`  ✅ 오후: ${scheduleData.afternoon}-${scheduleData.afternoonEnd} (${afternoonSchedule.total_hours}시간)`);
    }
    
    const totalHours = morningSchedule.total_hours + afternoonSchedule.total_hours;
    console.log(`  📊 총 근무시간: ${totalHours}시간`);
  }
  
  console.log('\n=== 9월 첫째 주 스케줄 수정 완료 ===');
}

fixHeoSeptemberSchedules().catch(console.error);

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

async function fixHeoSeptemberSchedules() {
  console.log('=== 허상원 9월 첫째 주 스케줄 수정 (점심시간 제외) ===');
  
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
  
  // 8월 31일부터 9월 6일까지 스케줄 확인
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', heo.id)
    .gte('schedule_date', '2025-08-31')
    .lte('schedule_date', '2025-09-06')
    .order('schedule_date');
    
  if (scheduleError) {
    console.error('스케줄 조회 실패:', scheduleError);
    return;
  }
  
  console.log(`수정할 스케줄 수: ${schedules.length}개\n`);
  
  // 점심시간이 포함된 스케줄들을 삭제하고 분리해서 재생성
  const schedulesToDelete = schedules.filter(s => {
    const start = new Date(`2000-01-01T${s.scheduled_start}`);
    const end = new Date(`2000-01-01T${s.scheduled_end}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const lunchStart = new Date(`2000-01-01T12:00:00`);
    const lunchEnd = new Date(`2000-01-01T13:00:00`);
    
    // 점심시간과 겹치는지 확인
    return (start < lunchEnd && end > lunchStart);
  });
  
  console.log(`점심시간 포함 스케줄 삭제 대상: ${schedulesToDelete.length}개`);
  
  // 점심시간 포함 스케줄 삭제
  for (const schedule of schedulesToDelete) {
    console.log(`삭제: ${schedule.schedule_date} ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
    
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', schedule.id);
      
    if (deleteError) {
      console.error(`스케줄 삭제 실패:`, deleteError);
    } else {
      console.log(`✅ 삭제 완료`);
    }
  }
  
  console.log('\n=== 점심시간 제외 스케줄 재생성 ===');
  
  // 9월 첫째 주 스케줄 데이터 (점심시간 제외)
  const septemberSchedules = [
    { date: '2025-09-01', morning: '09:00:00', morningEnd: '12:00:00', afternoon: '13:00:00', afternoonEnd: '17:00:00' },
    { date: '2025-09-02', morning: '09:00:00', morningEnd: '12:00:00', afternoon: '13:00:00', afternoonEnd: '16:30:00' },
    { date: '2025-09-03', morning: '09:00:00', morningEnd: '12:00:00', afternoon: '13:00:00', afternoonEnd: '17:00:00' },
    { date: '2025-09-04', morning: '09:00:00', morningEnd: '12:00:00', afternoon: '13:00:00', afternoonEnd: '17:00:00' }
  ];
  
  for (const scheduleData of septemberSchedules) {
    console.log(`\n📅 ${scheduleData.date}`);
    
    // 오전 스케줄 생성 (9:00 - 12:00)
    const morningSchedule = {
      employee_id: heo.id,
      schedule_date: scheduleData.date,
      scheduled_start: scheduleData.morning,
      scheduled_end: scheduleData.morningEnd,
      status: 'approved',
      employee_note: '오전 근무',
      total_hours: calculateHours(scheduleData.morning, scheduleData.morningEnd),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 오후 스케줄 생성 (13:00 - 종료시간)
    const afternoonSchedule = {
      employee_id: heo.id,
      schedule_date: scheduleData.date,
      scheduled_start: scheduleData.afternoon,
      scheduled_end: scheduleData.afternoonEnd,
      status: 'approved',
      employee_note: '오후 근무',
      total_hours: calculateHours(scheduleData.afternoon, scheduleData.afternoonEnd),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 오전 스케줄 삽입
    const { data: morningData, error: morningError } = await supabase
      .from('schedules')
      .insert(morningSchedule)
      .select()
      .single();
      
    if (morningError) {
      console.error(`오전 스케줄 삽입 실패:`, morningError);
    } else {
      console.log(`  ✅ 오전: ${scheduleData.morning}-${scheduleData.morningEnd} (${morningSchedule.total_hours}시간)`);
    }
    
    // 오후 스케줄 삽입
    const { data: afternoonData, error: afternoonError } = await supabase
      .from('schedules')
      .insert(afternoonSchedule)
      .select()
      .single();
      
    if (afternoonError) {
      console.error(`오후 스케줄 삽입 실패:`, afternoonError);
    } else {
      console.log(`  ✅ 오후: ${scheduleData.afternoon}-${scheduleData.afternoonEnd} (${afternoonSchedule.total_hours}시간)`);
    }
    
    const totalHours = morningSchedule.total_hours + afternoonSchedule.total_hours;
    console.log(`  📊 총 근무시간: ${totalHours}시간`);
  }
  
  console.log('\n=== 9월 첫째 주 스케줄 수정 완료 ===');
}

fixHeoSeptemberSchedules().catch(console.error);
