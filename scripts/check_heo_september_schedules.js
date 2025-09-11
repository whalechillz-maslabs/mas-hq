const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkHeoSeptemberSchedules() {
  console.log('=== 허상원 9월 첫째 주 스케줄 확인 (8/31 - 9/6) ===');
  
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
  
  console.log(`\n조회된 스케줄 수: ${schedules.length}개`);
  
  if (schedules.length === 0) {
    console.log('8/31 - 9/6 기간에 스케줄이 없습니다.');
    return;
  }
  
  // 날짜별로 그룹화
  const scheduleByDate = {};
  schedules.forEach(schedule => {
    const date = schedule.schedule_date;
    if (!scheduleByDate[date]) {
      scheduleByDate[date] = [];
    }
    scheduleByDate[date].push(schedule);
  });
  
  console.log('\n=== 날짜별 스케줄 상세 ===');
  
  const targetDates = ['2025-08-31', '2025-09-01', '2025-09-02', '2025-09-03', '2025-09-04', '2025-09-05', '2025-09-06'];
  
  targetDates.forEach(date => {
    const daySchedules = scheduleByDate[date] || [];
    
    if (daySchedules.length > 0) {
      const dayTotalHours = daySchedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
      
      console.log(`\n📅 ${date} (${new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })})`);
      console.log(`   총 근무시간: ${dayTotalHours}시간`);
      
      daySchedules.forEach(s => {
        const startTime = s.scheduled_start;
        const endTime = s.scheduled_end;
        const hours = s.total_hours || 0;
        
        console.log(`   - ${startTime} ~ ${endTime} (${hours}시간)`);
        
        // 점심시간 포함 여부 확인
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        
        const lunchStart = new Date(`2000-01-01T12:00:00`);
        const lunchEnd = new Date(`2000-01-01T13:00:00`);
        
        // 점심시간과 겹치는지 확인
        if ((start < lunchEnd && end > lunchStart)) {
          console.log(`   ⚠️ 점심시간(12:00-13:00) 포함됨!`);
          
          // 점심시간 제외한 실제 근무시간 계산
          let actualStart = start;
          let actualEnd = end;
          
          if (start < lunchStart && end > lunchStart) {
            // 시작은 점심 전, 종료는 점심 후
            actualEnd = lunchStart;
          } else if (start < lunchEnd && end > lunchEnd) {
            // 시작은 점심 중, 종료는 점심 후
            actualStart = lunchEnd;
          } else if (start >= lunchStart && end <= lunchEnd) {
            // 전체가 점심시간 내
            console.log(`   ❌ 전체가 점심시간입니다!`);
            return;
          }
          
          const actualHours = (actualEnd - actualStart) / (1000 * 60 * 60);
          console.log(`   💡 점심시간 제외 시: ${actualHours.toFixed(1)}시간`);
        } else {
          console.log(`   ✅ 점심시간 제외됨`);
        }
      });
    } else {
      console.log(`\n📅 ${date} (${new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })}) - 스케줄 없음`);
    }
  });
  
  // 전체 요약
  const totalHours = schedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
  console.log(`\n📊 전체 요약:`);
  console.log(`총 스케줄 수: ${schedules.length}개`);
  console.log(`총 근무시간: ${totalHours}시간`);
}

checkHeoSeptemberSchedules().catch(console.error);

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkHeoSeptemberSchedules() {
  console.log('=== 허상원 9월 첫째 주 스케줄 확인 (8/31 - 9/6) ===');
  
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
  
  console.log(`\n조회된 스케줄 수: ${schedules.length}개`);
  
  if (schedules.length === 0) {
    console.log('8/31 - 9/6 기간에 스케줄이 없습니다.');
    return;
  }
  
  // 날짜별로 그룹화
  const scheduleByDate = {};
  schedules.forEach(schedule => {
    const date = schedule.schedule_date;
    if (!scheduleByDate[date]) {
      scheduleByDate[date] = [];
    }
    scheduleByDate[date].push(schedule);
  });
  
  console.log('\n=== 날짜별 스케줄 상세 ===');
  
  const targetDates = ['2025-08-31', '2025-09-01', '2025-09-02', '2025-09-03', '2025-09-04', '2025-09-05', '2025-09-06'];
  
  targetDates.forEach(date => {
    const daySchedules = scheduleByDate[date] || [];
    
    if (daySchedules.length > 0) {
      const dayTotalHours = daySchedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
      
      console.log(`\n📅 ${date} (${new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })})`);
      console.log(`   총 근무시간: ${dayTotalHours}시간`);
      
      daySchedules.forEach(s => {
        const startTime = s.scheduled_start;
        const endTime = s.scheduled_end;
        const hours = s.total_hours || 0;
        
        console.log(`   - ${startTime} ~ ${endTime} (${hours}시간)`);
        
        // 점심시간 포함 여부 확인
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        
        const lunchStart = new Date(`2000-01-01T12:00:00`);
        const lunchEnd = new Date(`2000-01-01T13:00:00`);
        
        // 점심시간과 겹치는지 확인
        if ((start < lunchEnd && end > lunchStart)) {
          console.log(`   ⚠️ 점심시간(12:00-13:00) 포함됨!`);
          
          // 점심시간 제외한 실제 근무시간 계산
          let actualStart = start;
          let actualEnd = end;
          
          if (start < lunchStart && end > lunchStart) {
            // 시작은 점심 전, 종료는 점심 후
            actualEnd = lunchStart;
          } else if (start < lunchEnd && end > lunchEnd) {
            // 시작은 점심 중, 종료는 점심 후
            actualStart = lunchEnd;
          } else if (start >= lunchStart && end <= lunchEnd) {
            // 전체가 점심시간 내
            console.log(`   ❌ 전체가 점심시간입니다!`);
            return;
          }
          
          const actualHours = (actualEnd - actualStart) / (1000 * 60 * 60);
          console.log(`   💡 점심시간 제외 시: ${actualHours.toFixed(1)}시간`);
        } else {
          console.log(`   ✅ 점심시간 제외됨`);
        }
      });
    } else {
      console.log(`\n📅 ${date} (${new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })}) - 스케줄 없음`);
    }
  });
  
  // 전체 요약
  const totalHours = schedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
  console.log(`\n📊 전체 요약:`);
  console.log(`총 스케줄 수: ${schedules.length}개`);
  console.log(`총 근무시간: ${totalHours}시간`);
}

checkHeoSeptemberSchedules().catch(console.error);
