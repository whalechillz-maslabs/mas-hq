const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSept19Data() {
  console.log('🔍 9월 19일 데이터 디버깅 시작');
  
  try {
    // 9월 19일 스케줄 데이터 확인
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .eq('schedule_date', '2025-09-19')
      .in('status', ['approved', 'pending', 'completed', 'in_progress']);

    if (scheduleError) {
      console.error('❌ 스케줄 쿼리 에러:', scheduleError);
      return;
    }

    console.log(`📊 9월 19일 스케줄 개수: ${schedules.length}`);
    
    // 각 스케줄의 데이터 구조 확인
    schedules.forEach((schedule, index) => {
      console.log(`\n📋 스케줄 ${index + 1}:`);
      console.log(`   ID: ${schedule.id}`);
      console.log(`   직원: ${schedule.employee?.name || 'N/A'}`);
      console.log(`   상태: ${schedule.status}`);
      console.log(`   예정 시작: ${schedule.scheduled_start}`);
      console.log(`   예정 종료: ${schedule.scheduled_end}`);
      console.log(`   실제 시작: ${schedule.actual_start}`);
      console.log(`   실제 종료: ${schedule.actual_end}`);
      console.log(`   노트: ${schedule.employee_note || 'N/A'}`);
      
      // 문제가 될 수 있는 데이터 확인
      if (schedule.actual_start && typeof schedule.actual_start !== 'string') {
        console.log(`   ⚠️ actual_start 타입 이상: ${typeof schedule.actual_start}`);
      }
      if (schedule.actual_end && typeof schedule.actual_end !== 'string') {
        console.log(`   ⚠️ actual_end 타입 이상: ${typeof schedule.actual_end}`);
      }
    });

    // 출근 기록도 확인
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', '2025-09-19');

    if (attendanceError) {
      console.error('❌ 출근 기록 쿼리 에러:', attendanceError);
    } else {
      console.log(`\n📊 9월 19일 출근 기록 개수: ${attendance.length}`);
      
      attendance.forEach((record, index) => {
        console.log(`\n📋 출근 기록 ${index + 1}:`);
        console.log(`   직원 ID: ${record.employee_id}`);
        console.log(`   출근 시간: ${record.check_in_time}`);
        console.log(`   퇴근 시간: ${record.check_out_time}`);
        console.log(`   휴식 시작: ${record.break_start_time}`);
        console.log(`   휴식 종료: ${record.break_end_time}`);
      });
    }

    // 문제가 될 수 있는 특수 문자나 형식 확인
    console.log('\n🔍 특수 데이터 확인:');
    schedules.forEach((schedule, index) => {
      const fields = ['actual_start', 'actual_end', 'employee_note'];
      fields.forEach(field => {
        const value = schedule[field];
        if (value && typeof value === 'string') {
          // 특수 문자나 이상한 형식 확인
          if (value.includes('\n') || value.includes('\r') || value.includes('\t')) {
            console.log(`   ⚠️ 스케줄 ${index + 1} ${field}에 특수 문자 포함: ${JSON.stringify(value)}`);
          }
          if (value.length > 1000) {
            console.log(`   ⚠️ 스케줄 ${index + 1} ${field}가 너무 김: ${value.length}자`);
          }
        }
      });
    });

  } catch (error) {
    console.error('❌ 전체 에러:', error);
  }
}

debugSept19Data();
