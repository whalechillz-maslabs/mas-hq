const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function fixChoiSeptemberSchedule() {
  console.log('🔧 최형호 9월 스케줄을 월요일-금요일로 수정 중...');
  
  try {
    // 1. 최형호 직원 정보 조회
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
    
    // 2. 기존 9월 스케줄 조회 및 삭제
    console.log('\n2. 기존 9월 스케줄 조회 및 삭제 중...');
    const { data: existingSchedules, error: existingError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-09-01')
      .lte('schedule_date', '2025-09-30');
    
    if (existingError) {
      console.log('❌ 기존 9월 스케줄 조회 실패:', existingError.message);
      return;
    }
    
    console.log('✅ 기존 9월 스케줄:', existingSchedules.length + '개');
    
    // 기존 스케줄 삭제
    for (const schedule of existingSchedules) {
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', schedule.id);
      
      if (deleteError) {
        console.log('❌ 기존 스케줄 삭제 실패:', deleteError.message);
      } else {
        console.log('✅ 기존 스케줄 삭제 성공:', schedule.schedule_date + ' ' + schedule.scheduled_start + '-' + schedule.scheduled_end);
      }
    }
    
    // 3. 새로운 9월 스케줄 생성 (월요일-금요일만, 9월 30일 제외)
    console.log('\n3. 새로운 9월 스케줄 생성 중 (월요일-금요일만)...');
    
    // 2025년 9월의 월요일-금요일 날짜들 (9월 30일 제외)
    const septemberWeekdays = [
      '2025-09-01', // 월
      '2025-09-02', // 화
      '2025-09-03', // 수
      '2025-09-04', // 목
      '2025-09-05', // 금
      '2025-09-08', // 월
      '2025-09-09', // 화
      '2025-09-10', // 수
      '2025-09-11', // 목
      '2025-09-12', // 금
      '2025-09-15', // 월
      '2025-09-16', // 화
      '2025-09-17', // 수
      '2025-09-18', // 목
      '2025-09-19', // 금
      '2025-09-22', // 월
      '2025-09-23', // 화
      '2025-09-24', // 수
      '2025-09-25', // 목
      '2025-09-26', // 금
      '2025-09-29'  // 월 (9월 30일 제외)
    ];
    
    const newSchedules = [];
    
    for (const date of septemberWeekdays) {
      // 오전 근무 (9:00-12:00)
      newSchedules.push({
        employee_id: choiEmployee.id,
        schedule_date: date,
        scheduled_start: '09:00:00',
        scheduled_end: '12:00:00',
        status: 'approved',
        employee_note: '관리자가 수정함 (월-금만)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // 오후 근무 (13:00-17:00)
      newSchedules.push({
        employee_id: choiEmployee.id,
        schedule_date: date,
        scheduled_start: '13:00:00',
        scheduled_end: '17:00:00',
        status: 'approved',
        employee_note: '관리자가 수정함 (월-금만)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // 새로운 스케줄 삽입
    const { error: insertError } = await supabase
      .from('schedules')
      .insert(newSchedules);
    
    if (insertError) {
      console.log('❌ 새로운 9월 스케줄 생성 실패:', insertError.message);
      return;
    }
    
    console.log('✅ 새로운 9월 스케줄 생성 완료:', newSchedules.length + '개');
    
    // 4. 최종 확인
    console.log('\n4. 최종 확인 중...');
    const { data: finalSchedules, error: finalError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-09-01')
      .lte('schedule_date', '2025-09-30')
      .order('schedule_date', { ascending: true });
    
    if (finalError) {
      console.log('❌ 최종 확인 실패:', finalError.message);
      return;
    }
    
    console.log('✅ 최형호 9월 최종 스케줄 (총 ' + finalSchedules.length + '개):');
    
    // 날짜별로 그룹화하여 출력
    const schedulesByDate = {};
    finalSchedules.forEach(schedule => {
      if (!schedulesByDate[schedule.schedule_date]) {
        schedulesByDate[schedule.schedule_date] = [];
      }
      schedulesByDate[schedule.schedule_date].push(schedule);
    });
    
    Object.keys(schedulesByDate).sort().forEach(date => {
      const daySchedules = schedulesByDate[date];
      const dayName = new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' });
      console.log(`  ${date} (${dayName}): ${daySchedules.length}개 스케줄`);
      daySchedules.forEach(schedule => {
        console.log(`    - ${schedule.scheduled_start} ~ ${schedule.scheduled_end} (${schedule.status})`);
      });
    });
    
    console.log('\n🎉 최형호 9월 스케줄 수정 완료!');
    console.log('📅 월요일-금요일만 등록됨 (주말 및 9월 30일 제외)');
    console.log('⏰ 오전 9:00-12:00, 오후 13:00-17:00');
    console.log('✅ 상태: approved');
    
  } catch (error) {
    console.log('❌ 오류 발생:', error.message);
  }
}

// 스크립트 실행
fixChoiSeptemberSchedule();
