const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyChoiSchedules() {
  try {
    console.log('🔍 최형호 8월 25일~29일 스케줄 확인 중...');

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

    // 8월 25일~29일 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-25')
      .lte('schedule_date', '2025-08-29')
      .order('schedule_date', { ascending: true });

    if (scheduleError) {
      console.error('❌ 스케줄 조회 오류:', scheduleError);
      return;
    }

    console.log(`\n📋 최형호 8월 25일~29일 스케줄 (총 ${schedules.length}개):`);
    console.log('=' .repeat(80));

    let totalNetHours = 0;

    schedules.forEach(schedule => {
      const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
      const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
      const totalHours = (end - start) / (1000 * 60 * 60);
      const netHours = totalHours - (schedule.break_minutes / 60);
      totalNetHours += netHours;

      const dayOfWeek = start.toLocaleDateString('ko-KR', { weekday: 'short' });
      
      console.log(`${schedule.schedule_date} (${dayOfWeek}) ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
      console.log(`  → 총 ${totalHours}시간 - 점심 ${schedule.break_minutes}분 = 순 근무 ${netHours}시간`);
      console.log(`  → 상태: ${schedule.status}, 메모: ${schedule.employee_note}`);
      console.log('');
    });

    console.log('=' .repeat(80));
    console.log(`📊 총 순 근무시간: ${totalNetHours}시간 (점심시간 제외)`);
    console.log(`📊 평균 일일 근무시간: ${(totalNetHours / schedules.length).toFixed(1)}시간`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

verifyChoiSchedules();
