const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createTodaySchedule() {
  console.log('🔍 김탁수의 오늘 스케줄 생성 중...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 오늘 날짜:', today);
    
    // 1. 김탁수 직원 정보 조회
    console.log('\n1. 김탁수 직원 정보 조회...');
    const { data: kimEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, employment_type')
      .eq('name', '김탁수')
      .single();
    
    if (empError) {
      console.log('❌ 김탁수 직원 정보 조회 실패:', empError.message);
      return;
    }
    
    console.log('✅ 김탁수 직원 정보:');
    console.log('  - ID:', kimEmployee.id);
    console.log('  - 이름:', kimEmployee.name);
    console.log('  - 직원ID:', kimEmployee.employee_id);
    console.log('  - 고용형태:', kimEmployee.employment_type);
    
    // 2. 기존 오늘 스케줄 확인
    console.log('\n2. 기존 오늘 스케줄 확인...');
    const { data: existingSchedules, error: existingError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('schedule_date', today);
    
    if (existingError) {
      console.log('❌ 기존 스케줄 조회 실패:', existingError.message);
      return;
    }
    
    console.log('✅ 기존 오늘 스케줄:', existingSchedules.length + '개');
    
    if (existingSchedules.length > 0) {
      console.log('⚠️ 이미 오늘 스케줄이 있습니다');
      existingSchedules.forEach((schedule, index) => {
        console.log(`  스케줄 ${index + 1}:`);
        console.log('    - ID:', schedule.id);
        console.log('    - 시작시간:', schedule.scheduled_start || schedule.start_time);
        console.log('    - 종료시간:', schedule.scheduled_end || schedule.end_time);
        console.log('    - 상태:', schedule.status);
      });
      return;
    }
    
    // 3. 오늘 스케줄 생성 (월급제 직원이므로 9시-17시)
    console.log('\n3. 오늘 스케줄 생성 중...');
    
    const scheduleData = {
      employee_id: kimEmployee.id,
      schedule_date: today,
      scheduled_start: '09:00:00',
      scheduled_end: '17:00:00',
      work_hours: 8.0,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 생성할 스케줄 데이터:', scheduleData);
    
    const { data: newSchedule, error: createError } = await supabase
      .from('schedules')
      .insert(scheduleData)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ 스케줄 생성 실패:', createError.message);
      return;
    }
    
    console.log('✅ 오늘 스케줄 생성 성공!');
    console.log('📋 생성된 스케줄:');
    console.log('  - ID:', newSchedule.id);
    console.log('  - 날짜:', newSchedule.schedule_date);
    console.log('  - 시작시간:', newSchedule.scheduled_start);
    console.log('  - 종료시간:', newSchedule.scheduled_end);
    console.log('  - 근무시간:', newSchedule.work_hours + '시간');
    console.log('  - 상태:', newSchedule.status);
    
    // 4. 생성 확인
    console.log('\n4. 생성 확인...');
    const { data: verifySchedules, error: verifyError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('schedule_date', today);
    
    if (verifyError) {
      console.log('❌ 생성 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 생성 확인 성공:', verifySchedules.length + '개 스케줄');
    }
    
    console.log('\n🎉 김탁수의 오늘 스케줄 생성 완료!');
    console.log('💡 이제 출근 체크가 가능합니다');
    
  } catch (error) {
    console.error('❌ 스케줄 생성 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  createTodaySchedule().catch(console.error);
}

module.exports = { createTodaySchedule };
