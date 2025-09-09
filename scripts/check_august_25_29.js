const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkAugust25to29Schedule() {
  console.log('🔍 최형호 8월 25일~29일 스케줄 확인 중...');
  
  try {
    // 최형호 직원 정보 조회
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.log('❌ 최형호 직원 정보 조회 실패:', empError.message);
      return;
    }
    
    console.log('✅ 최형호 직원 정보:', choiEmployee.name, choiEmployee.employee_id);
    
    // 8월 25일~29일 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-25')
      .lte('schedule_date', '2025-08-29')
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.log('❌ 8월 25일~29일 스케줄 조회 실패:', scheduleError.message);
      return;
    }
    
    console.log('✅ 8월 25일~29일 스케줄 (총 ' + schedules.length + '개):');
    
    // 날짜별로 그룹화
    const schedulesByDate = {};
    schedules.forEach(schedule => {
      if (!schedulesByDate[schedule.schedule_date]) {
        schedulesByDate[schedule.schedule_date] = [];
      }
      schedulesByDate[schedule.schedule_date].push(schedule);
    });
    
    // 각 날짜별로 확인
    const dates = ['2025-08-25', '2025-08-26', '2025-08-27', '2025-08-28', '2025-08-29'];
    
    dates.forEach(date => {
      const daySchedules = schedulesByDate[date] || [];
      console.log(`\n📅 ${date}:`);
      
      if (daySchedules.length === 0) {
        console.log('  - 스케줄 없음');
      } else {
        daySchedules.forEach((schedule, index) => {
          console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status})`);
          
          // 점심시간과 겹치는지 확인
          const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
          const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
          const lunchStart = new Date('2000-01-01T12:00:00');
          const lunchEnd = new Date('2000-01-01T13:00:00');
          
          const overlapStart = new Date(Math.max(start.getTime(), lunchStart.getTime()));
          const overlapEnd = new Date(Math.min(end.getTime(), lunchEnd.getTime()));
          
          if (overlapStart < overlapEnd) {
            const overlapHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
            console.log(`     ❌ 점심시간 겹침: ${overlapHours}시간 (12:00-13:00)`);
          } else {
            console.log(`     ✅ 점심시간 겹침: 없음`);
          }
        });
      }
    });
    
    // 문제 분석
    console.log('\n📊 문제 분석:');
    let hasLunchOverlap = false;
    let needsFix = [];
    
    schedules.forEach(schedule => {
      const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
      const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
      const lunchStart = new Date('2000-01-01T12:00:00');
      const lunchEnd = new Date('2000-01-01T13:00:00');
      
      const overlapStart = new Date(Math.max(start.getTime(), lunchStart.getTime()));
      const overlapEnd = new Date(Math.min(end.getTime(), lunchEnd.getTime()));
      
      if (overlapStart < overlapEnd) {
        hasLunchOverlap = true;
        needsFix.push(schedule);
      }
    });
    
    if (hasLunchOverlap) {
      console.log('❌ 문제 발견: 8월 25일~29일 스케줄에서 12시-1시 점심시간이 제외되지 않았습니다');
      console.log('💡 수정이 필요한 스케줄:', needsFix.length + '개');
      needsFix.forEach(schedule => {
        console.log(`  - ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
      });
    } else {
      console.log('✅ 8월 25일~29일 스케줄에서 점심시간이 올바르게 제외되었습니다');
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  checkAugust25to29Schedule().catch(console.error);
}

module.exports = { checkAugust25to29Schedule };
