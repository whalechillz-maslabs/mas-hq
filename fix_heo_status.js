const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixHeoStatus() {
  console.log('🔧 허상원 상태 수정 중...');
  
  const today = '2025-09-15';
  
  // 허상원의 UUID 조회
  const { data: heoEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%허상원%')
    .single();
  
  if (heoEmployee) {
    console.log(`✅ 허상원: ${heoEmployee.name} (ID: ${heoEmployee.id})`);
    
    // schedules 테이블에서 상태를 'break'에서 'completed'로 변경
    const { error: scheduleError } = await supabase
      .from('schedules')
      .update({
        status: 'completed'
      })
      .eq('employee_id', heoEmployee.id)
      .eq('schedule_date', today);
    
    if (scheduleError) {
      console.error('❌ schedules 테이블 수정 실패:', scheduleError);
    } else {
      console.log('✅ schedules 테이블 상태 수정 완료 (break → completed)');
    }
    
    // 수정된 데이터 확인
    const { data: updatedSchedule } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .eq('schedule_date', today)
      .single();
    
    if (updatedSchedule) {
      console.log('\n📊 수정된 schedules 데이터:');
      console.log(`  - status: ${updatedSchedule.status}`);
      console.log(`  - actual_start: ${updatedSchedule.actual_start}`);
      console.log(`  - actual_end: ${updatedSchedule.actual_end}`);
    }
  }
  
  console.log('\n✅ 허상원 상태 수정 완료!');
}

fixHeoStatus().catch(console.error);
