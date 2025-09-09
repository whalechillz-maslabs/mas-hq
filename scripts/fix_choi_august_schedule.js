const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function fixChoiAugustSchedule() {
  try {
    console.log('=== 최형호 8월 스케줄 정확한 시간으로 수정 ===');
    
    // 정확한 스케줄 데이터
    const correctSchedule = [
      { date: '2025-08-01', start: '14:30', end: '15:30' },
      { date: '2025-08-04', start: '13:00', end: '17:00' },
      { date: '2025-08-08', start: '13:00', end: '16:30' },
      { date: '2025-08-11', start: '13:00', end: '17:00' },
      { date: '2025-08-13', start: '10:00', end: '17:00' }, // 6시간 (DB에는 5.5시간)
      { date: '2025-08-14', start: '15:00', end: '17:00' },
      { date: '2025-08-18', start: '10:00', end: '17:00' }, // 6시간 (DB에는 4시간)
      { date: '2025-08-20', start: '10:00', end: '17:00' },
      { date: '2025-08-22', start: '10:00', end: '17:00' },
      { date: '2025-08-25', start: '10:00', end: '17:00' },
      { date: '2025-08-26', start: '10:00', end: '18:00' },
      { date: '2025-08-27', start: '10:00', end: '17:00' },
      { date: '2025-08-28', start: '10:00', end: '17:00' },
      { date: '2025-08-29', start: '10:00', end: '17:00' }
    ];
    
    // 1. 최형호 정보 확인
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.error('직원 조회 오류:', empError);
      return;
    }
    
    console.log(`직원: ${choiEmployee.name} (${choiEmployee.employee_id})`);
    
    // 2. 기존 8월 스케줄 삭제
    console.log('\n기존 8월 스케줄 삭제 중...');
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31');
    
    if (deleteError) {
      console.error('기존 스케줄 삭제 오류:', deleteError);
      return;
    }
    
    console.log('기존 스케줄 삭제 완료');
    
    // 3. 정확한 스케줄로 재입력
    console.log('\n정확한 스케줄 입력 중...');
    const schedulesToInsert = correctSchedule.map(work => ({
      employee_id: choiEmployee.id,
      schedule_date: work.date,
      scheduled_start: work.start,
      scheduled_end: work.end,
      status: 'approved',
      employee_note: '정확한 근무시간으로 수정됨',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data: insertedSchedules, error: insertError } = await supabase
      .from('schedules')
      .insert(schedulesToInsert)
      .select();
    
    if (insertError) {
      console.error('스케줄 입력 오류:', insertError);
      return;
    }
    
    console.log(`정확한 스케줄 ${insertedSchedules.length}개 입력 완료`);
    
    // 4. 검증
    console.log('\n=== 📊 수정 후 검증 ===');
    const { data: verifySchedules, error: verifyError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });
    
    if (verifyError) {
      console.error('검증 오류:', verifyError);
      return;
    }
    
    let totalHours = 0;
    verifySchedules.forEach(schedule => {
      const start = new Date(`2025-08-01 ${schedule.scheduled_start}`);
      const end = new Date(`2025-08-01 ${schedule.scheduled_end}`);
      const hours = (end - start) / (1000 * 60 * 60);
      totalHours += hours;
      
      console.log(`${schedule.schedule_date}: ${schedule.scheduled_start} ~ ${schedule.scheduled_end} (${hours}시간)`);
    });
    
    console.log(`\n총 근무시간: ${totalHours}시간`);
    
    // 5. 급여 계산
    const hourlyWage1 = 13000; // 8월 1일~7일
    const hourlyWage2 = 12000; // 8월 8일~31일
    
    let totalWage = 0;
    verifySchedules.forEach(schedule => {
      const day = parseInt(schedule.schedule_date.split('-')[2]);
      const start = new Date(`2025-08-01 ${schedule.scheduled_start}`);
      const end = new Date(`2025-08-01 ${schedule.scheduled_end}`);
      const hours = (end - start) / (1000 * 60 * 60);
      const wage = day <= 7 ? hourlyWage1 : hourlyWage2;
      const dayWage = hours * wage;
      totalWage += dayWage;
    });
    
    console.log(`\n=== 💰 최종 급여명세서 ===`);
    console.log(`총 근무시간: ${totalHours}시간`);
    console.log(`총 급여: ${totalWage.toLocaleString()}원`);
    console.log(`세금 (3.3%): ${Math.floor(totalWage * 0.033).toLocaleString()}원`);
    console.log(`실수령액: ${(totalWage - Math.floor(totalWage * 0.033)).toLocaleString()}원`);
    
    console.log('\n✅ 스케줄 수정 완료!');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

fixChoiAugustSchedule();
