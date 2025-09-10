const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChoiSchedules() {
  try {
    console.log('🔍 최형호 현재 8월 스케줄 확인 중...');

    // 최형호 직원 ID 조회
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호');

    if (employeeError) {
      console.error('❌ 직원 조회 오류:', employeeError);
      return;
    }

    const choiEmployee = employees[0];
    console.log('✅ 최형호 직원 정보:', choiEmployee);

    // 8월 전체 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });

    if (scheduleError) {
      console.error('❌ 스케줄 조회 오류:', scheduleError);
      return;
    }

    console.log(`\n📋 최형호 8월 전체 스케줄 (총 ${schedules.length}개):`);
    console.log('=' .repeat(100));

    schedules.forEach(schedule => {
      const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
      const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
      const totalHours = (end - start) / (1000 * 60 * 60);
      const netHours = totalHours - (schedule.break_minutes / 60);
      const dayOfWeek = start.toLocaleDateString('ko-KR', { weekday: 'short' });
      
      console.log(`${schedule.schedule_date} (${dayOfWeek}) ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
      console.log(`  → 총 ${totalHours}시간 - 점심 ${schedule.break_minutes}분 = 순 근무 ${netHours}시간`);
      console.log(`  → 상태: ${schedule.status}, 메모: ${schedule.employee_note}`);
      
      // 점심시간 포함 여부 확인
      const startHour = parseInt(schedule.scheduled_start.split(':')[0]);
      const endHour = parseInt(schedule.scheduled_end.split(':')[0]);
      const hasLunchTime = startHour <= 12 && endHour >= 13;
      
      if (hasLunchTime) {
        console.log(`  ⚠️  점심시간(12-13시) 포함됨 - 스케줄 수정 필요!`);
      }
      console.log('');
    });

    // 점심시간이 포함된 스케줄 개수 확인
    const schedulesWithLunch = schedules.filter(schedule => {
      const startHour = parseInt(schedule.scheduled_start.split(':')[0]);
      const endHour = parseInt(schedule.scheduled_end.split(':')[0]);
      return startHour <= 12 && endHour >= 13;
    });

    console.log('=' .repeat(100));
    console.log(`⚠️  점심시간이 포함된 스케줄: ${schedulesWithLunch.length}개`);
    console.log(`✅ 점심시간이 제외된 스케줄: ${schedules.length - schedulesWithLunch.length}개`);

    if (schedulesWithLunch.length > 0) {
      console.log('\n🔄 수정이 필요한 스케줄:');
      schedulesWithLunch.forEach(schedule => {
        console.log(`  - ${schedule.schedule_date}: ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkChoiSchedules();
