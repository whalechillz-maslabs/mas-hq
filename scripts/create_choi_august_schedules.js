const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createChoiAugustSchedules() {
  console.log('🔍 최형호 8월 스케줄 일괄 생성 중...');
  
  try {
    // 1. 최형호 직원 정보 조회
    console.log('\n1. 최형호 직원 정보 조회...');
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, employment_type')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.log('❌ 최형호 직원 정보 조회 실패:', empError.message);
      return;
    }
    
    console.log('✅ 최형호 직원 정보:');
    console.log('  - ID:', choiEmployee.id);
    console.log('  - 이름:', choiEmployee.name);
    console.log('  - 직원ID:', choiEmployee.employee_id);
    console.log('  - 고용형태:', choiEmployee.employment_type);
    
    // 2. 8월 스케줄 데이터 정의 (12시-1시 점심시간 제외)
    const augustSchedules = [
      { date: '2025-08-01', start: '14:30:00', end: '15:30:00', hours: 1, note: '8/1 금요일' },
      { date: '2025-08-04', start: '13:00:00', end: '17:00:00', hours: 4, note: '8/4 월요일' },
      { date: '2025-08-08', start: '13:00:00', end: '16:30:00', hours: 3.5, note: '8/8 금요일' },
      { date: '2025-08-11', start: '13:00:00', end: '17:00:00', hours: 4, note: '8/11 월요일' },
      { date: '2025-08-13', start: '10:00:00', end: '17:00:00', hours: 6, note: '8/13 수요일' },
      { date: '2025-08-14', start: '15:00:00', end: '17:00:00', hours: 2, note: '8/14 목요일' },
      { date: '2025-08-18', start: '10:00:00', end: '17:00:00', hours: 6, note: '8/18 월요일' },
      { date: '2025-08-20', start: '10:00:00', end: '17:00:00', hours: 6, note: '8/20 수요일' },
      { date: '2025-08-22', start: '10:00:00', end: '17:00:00', hours: 6, note: '8/22 금요일' },
      { date: '2025-08-25', start: '10:00:00', end: '17:00:00', hours: 6, note: '8/25 월요일' },
      { date: '2025-08-26', start: '10:00:00', end: '18:00:00', hours: 7, note: '8/26 화요일' },
      { date: '2025-08-27', start: '10:00:00', end: '17:00:00', hours: 6, note: '8/27 수요일' },
      { date: '2025-08-28', start: '10:00:00', end: '17:00:00', hours: 6, note: '8/28 목요일' },
      { date: '2025-08-29', start: '10:00:00', end: '17:00:00', hours: 6, note: '8/29 금요일' }
    ];
    
    console.log('\n2. 8월 스케줄 데이터 준비...');
    console.log('📋 총 스케줄 수:', augustSchedules.length + '개');
    
    // 3. 기존 8월 스케줄 확인 및 삭제
    console.log('\n3. 기존 8월 스케줄 확인 및 삭제...');
    const augustDates = augustSchedules.map(s => s.date);
    
    const { data: existingSchedules, error: existingError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .in('schedule_date', augustDates);
    
    if (existingError) {
      console.log('❌ 기존 스케줄 조회 실패:', existingError.message);
      return;
    }
    
    console.log('✅ 기존 8월 스케줄:', existingSchedules.length + '개');
    
    if (existingSchedules.length > 0) {
      console.log('⚠️ 기존 스케줄을 삭제합니다...');
      
      for (const schedule of existingSchedules) {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', schedule.id);
        
        if (deleteError) {
          console.log('❌ 기존 스케줄 삭제 실패:', deleteError.message);
        } else {
          console.log('✅ 기존 스케줄 삭제 성공:', schedule.schedule_date);
        }
      }
    }
    
    // 4. 8월 스케줄 생성
    console.log('\n4. 8월 스케줄 생성 중...');
    
    const schedulesToInsert = augustSchedules.map(schedule => ({
      employee_id: choiEmployee.id,
      schedule_date: schedule.date,
      scheduled_start: schedule.start,
      scheduled_end: schedule.end,
      status: 'pending',
      employee_note: schedule.note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('📝 생성할 스케줄 데이터:');
    schedulesToInsert.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end} (${schedule.employee_note})`);
    });
    
    // 스케줄 일괄 생성
    const { data: newSchedules, error: createError } = await supabase
      .from('schedules')
      .insert(schedulesToInsert)
      .select();
    
    if (createError) {
      console.log('❌ 스케줄 생성 실패:', createError.message);
      return;
    }
    
    console.log('✅ 8월 스케줄 생성 성공!');
    console.log('📋 생성된 스케줄:', newSchedules.length + '개');
    
    // 5. 생성 확인 및 통계
    console.log('\n5. 생성 확인 및 통계...');
    const { data: verifySchedules, error: verifyError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .in('schedule_date', augustDates)
      .order('schedule_date', { ascending: true });
    
    if (verifyError) {
      console.log('❌ 생성 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 생성 확인 성공:', verifySchedules.length + '개 스케줄');
      
      // 통계 계산
      const totalHours = verifySchedules.reduce((total, schedule) => {
        const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
        const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
      
      const workDays = verifySchedules.length;
      const averageHours = totalHours / workDays;
      
      console.log('\n📊 8월 스케줄 통계:');
      console.log('  - 근무 일수:', workDays + '일');
      console.log('  - 총 근무 시간:', totalHours.toFixed(1) + '시간');
      console.log('  - 평균 근무 시간:', averageHours.toFixed(1) + '시간/일');
      console.log('  - 최대 근무 시간:', Math.max(...verifySchedules.map(s => {
        const start = new Date(`2000-01-01T${s.scheduled_start}`);
        const end = new Date(`2000-01-01T${s.scheduled_end}`);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      })).toFixed(1) + '시간');
      console.log('  - 최소 근무 시간:', Math.min(...verifySchedules.map(s => {
        const start = new Date(`2000-01-01T${s.scheduled_start}`);
        const end = new Date(`2000-01-01T${s.scheduled_end}`);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      })).toFixed(1) + '시간');
      
      // 일별 상세 정보
      console.log('\n📋 일별 스케줄 상세:');
      verifySchedules.forEach((schedule, index) => {
        const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
        const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        console.log(`  ${index + 1}. ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end} (${hours}시간) - ${schedule.employee_note}`);
      });
    }
    
    console.log('\n🎉 최형호 8월 스케줄 일괄 생성 완료!');
    console.log('💡 12시-1시 점심시간이 자동으로 제외되었습니다');
    
  } catch (error) {
    console.error('❌ 스케줄 생성 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  createChoiAugustSchedules().catch(console.error);
}

module.exports = { createChoiAugustSchedules };
