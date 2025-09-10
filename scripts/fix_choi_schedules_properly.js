const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixChoiSchedules() {
  try {
    console.log('🔧 최형호 스케줄을 올바르게 수정 시작...');

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

    // 점심시간이 포함된 스케줄들을 올바르게 수정
    const schedulesToFix = [
      { date: '2025-08-13', original: '10:00-17:00', morning: '10:00-12:00', afternoon: '13:00-17:00' },
      { date: '2025-08-18', original: '10:00-17:00', morning: '10:00-12:00', afternoon: '13:00-17:00' },
      { date: '2025-08-20', original: '10:00-17:00', morning: '10:00-12:00', afternoon: '13:00-17:00' },
      { date: '2025-08-22', original: '10:00-17:00', morning: '10:00-12:00', afternoon: '13:00-17:00' },
      { date: '2025-08-26', original: '10:00-18:00', morning: '10:00-12:00', afternoon: '13:00-18:00' },
      { date: '2025-08-27', original: '10:00-17:00', morning: '10:00-12:00', afternoon: '13:00-17:00' },
      { date: '2025-08-28', original: '10:00-17:00', morning: '10:00-12:00', afternoon: '13:00-17:00' },
      { date: '2025-08-29', original: '10:00-17:00', morning: '10:00-12:00', afternoon: '13:00-17:00' }
    ];

    for (const schedule of schedulesToFix) {
      console.log(`\n🔄 ${schedule.date} 스케줄 수정 중...`);
      console.log(`  기존: ${schedule.original} → 수정: ${schedule.morning} + ${schedule.afternoon}`);

      // 기존 스케줄 삭제
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('employee_id', choiEmployee.id)
        .eq('schedule_date', schedule.date);

      if (deleteError) {
        console.error(`❌ ${schedule.date} 기존 스케줄 삭제 오류:`, deleteError);
        continue;
      }

      // 새로운 스케줄 추가 (점심시간 제외)
      const newSchedules = [
        {
          employee_id: choiEmployee.id,
          schedule_date: schedule.date,
          scheduled_start: schedule.morning.split('-')[0],
          scheduled_end: schedule.morning.split('-')[1],
          break_minutes: 0, // 점심시간 제외했으므로 0
          status: 'approved',
          employee_note: `8월 근무 - 오전 (점심시간 제외)`
        },
        {
          employee_id: choiEmployee.id,
          schedule_date: schedule.date,
          scheduled_start: schedule.afternoon.split('-')[0],
          scheduled_end: schedule.afternoon.split('-')[1],
          break_minutes: 0, // 점심시간 제외했으므로 0
          status: 'approved',
          employee_note: `8월 근무 - 오후 (점심시간 제외)`
        }
      ];

      const { data: insertedSchedules, error: insertError } = await supabase
        .from('schedules')
        .insert(newSchedules)
        .select();

      if (insertError) {
        console.error(`❌ ${schedule.date} 새 스케줄 추가 오류:`, insertError);
        continue;
      }

      console.log(`✅ ${schedule.date} 스케줄 수정 완료!`);
      insertedSchedules.forEach(s => {
        const start = new Date(`${s.schedule_date} ${s.scheduled_start}`);
        const end = new Date(`${s.schedule_date} ${s.scheduled_end}`);
        const hours = (end - start) / (1000 * 60 * 60);
        console.log(`  - ${s.scheduled_start}-${s.scheduled_end}: ${hours}시간`);
      });
    }

    console.log('\n🎉 모든 스케줄 수정 완료!');
    console.log('📋 이제 점심시간이 제외된 올바른 스케줄로 입력되었습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixChoiSchedules();
