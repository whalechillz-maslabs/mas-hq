const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSept19BadData() {
  console.log('🔧 9월 19일 문제 데이터 수정 시작');
  
  try {
    // 문제가 되는 스케줄 ID (나수진의 09:00-09:30 스케줄)
    const badScheduleId = 'd511fe42-7770-460c-8394-0b77eb66833c';
    
    // 올바른 시간으로 수정 (09:00-09:30)
    const { error } = await supabase
      .from('schedules')
      .update({
        actual_start: '2025-09-19T09:00:00Z',
        actual_end: '2025-09-19T09:30:00Z',
        updated_at: new Date().toISOString()
      })
      .eq('id', badScheduleId);

    if (error) {
      console.error('❌ 스케줄 수정 실패:', error);
      return;
    }

    console.log('✅ 나수진 09:00-09:30 스케줄 수정 완료');
    
    // 수정된 데이터 확인
    const { data: updatedSchedule } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', badScheduleId)
      .single();

    if (updatedSchedule) {
      console.log('📋 수정된 스케줄:');
      console.log(`   실제 시작: ${updatedSchedule.actual_start}`);
      console.log(`   실제 종료: ${updatedSchedule.actual_end}`);
    }

    // 다른 문제가 될 수 있는 데이터도 확인
    const { data: allSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('schedule_date', '2025-09-19');

    console.log('\n🔍 다른 문제 데이터 확인:');
    allSchedules.forEach((schedule, index) => {
      if (schedule.actual_start && schedule.actual_start.includes('00:00:00')) {
        console.log(`   ⚠️ 스케줄 ${index + 1} (ID: ${schedule.id}) - actual_start: ${schedule.actual_start}`);
      }
      if (schedule.actual_end && schedule.actual_end.includes('00:30:00')) {
        console.log(`   ⚠️ 스케줄 ${index + 1} (ID: ${schedule.id}) - actual_end: ${schedule.actual_end}`);
      }
    });

  } catch (error) {
    console.error('❌ 전체 에러:', error);
  }
}

fixSept19BadData();
