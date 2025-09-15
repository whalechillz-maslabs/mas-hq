const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRemainingIssues() {
  console.log('🔧 남은 문제들 해결 중...');
  
  const today = '2025-09-15';
  
  // 1. 허상원 상태 다시 확인 및 수정
  console.log('\n👤 허상원 상태 재확인:');
  const { data: heoEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%허상원%')
    .single();
  
  if (heoEmployee) {
    console.log(`✅ 허상원: ${heoEmployee.name} (ID: ${heoEmployee.id})`);
    
    // schedules 테이블에서 상태 확인
    const { data: heoSchedule } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .eq('schedule_date', today)
      .single();
    
    if (heoSchedule) {
      console.log(`📊 현재 상태: ${heoSchedule.status}`);
      
      if (heoSchedule.status !== 'completed') {
        // 상태를 completed로 변경
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
          console.log('✅ schedules 테이블 상태 수정 완료 (completed)');
        }
      } else {
        console.log('✅ 이미 completed 상태입니다.');
      }
    }
  }
  
  // 2. 최형호 데이터도 확인
  console.log('\n👤 최형호 데이터 확인:');
  const { data: choiEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%최형호%')
    .single();
  
  if (choiEmployee) {
    console.log(`✅ 최형호: ${choiEmployee.name} (ID: ${choiEmployee.id})`);
    
    const { data: choiSchedule } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('schedule_date', today)
      .single();
    
    if (choiSchedule) {
      console.log(`📊 최형호 상태: ${choiSchedule.status}`);
    }
  }
  
  console.log('\n✅ 남은 문제 해결 완료!');
}

fixRemainingIssues().catch(console.error);
