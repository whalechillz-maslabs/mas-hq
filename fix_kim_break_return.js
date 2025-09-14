const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixKimBreakReturn() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`🔧 ${today} 김탁수 휴식 복귀 상태 수정...`);
  
  // 김탁수의 실제 employee_id 찾기
  const { data: employees, error: employeeError } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%김탁수%');
  
  if (employeeError || !employees || employees.length === 0) {
    console.error('❌ 김탁수 직원을 찾을 수 없습니다.');
    return;
  }
  
  const kimEmployee = employees[0];
  console.log(`✅ 김탁수 찾음: ${kimEmployee.name} (ID: ${kimEmployee.id})`);
  
  // 현재 break 상태인 스케줄들을 in_progress로 변경
  console.log('\n🔄 break 상태인 스케줄들을 in_progress로 변경...');
  
  const { data: breakSchedules, error: breakError } = await supabase
    .from('schedules')
    .select('id, scheduled_start, status, employee_note')
    .eq('employee_id', kimEmployee.id)
    .eq('schedule_date', today)
    .eq('status', 'break');
  
  if (breakError) {
    console.error('❌ break 스케줄 조회 오류:', breakError);
    return;
  }
  
  console.log(`📋 break 상태인 스케줄: ${breakSchedules?.length || 0}개`);
  
  if (breakSchedules && breakSchedules.length > 0) {
    // 첫 번째 스케줄만 in_progress로 변경 (현재 근무 중인 스케줄)
    const firstSchedule = breakSchedules[0];
    console.log(`🔄 첫 번째 스케줄을 in_progress로 변경: ${firstSchedule.scheduled_start}`);
    
    const { error: updateError } = await supabase
      .from('schedules')
      .update({
        status: 'in_progress',
        employee_note: '휴식 후 복귀'
      })
      .eq('id', firstSchedule.id);
    
    if (updateError) {
      console.error('❌ 스케줄 업데이트 오류:', updateError);
    } else {
      console.log('✅ 첫 번째 스케줄 업데이트 성공');
    }
    
    // 나머지 스케줄들은 pending으로 변경
    if (breakSchedules.length > 1) {
      const remainingIds = breakSchedules.slice(1).map(s => s.id);
      console.log(`🔄 나머지 ${remainingIds.length}개 스케줄을 pending으로 변경...`);
      
      const { error: updateRemainingError } = await supabase
        .from('schedules')
        .update({
          status: 'pending',
          employee_note: null
        })
        .in('id', remainingIds);
      
      if (updateRemainingError) {
        console.error('❌ 나머지 스케줄 업데이트 오류:', updateRemainingError);
      } else {
        console.log('✅ 나머지 스케줄 업데이트 성공');
      }
    }
  }
  
  // 결과 확인
  console.log('\n📊 수정 후 상태 확인:');
  const { data: updatedSchedules, error: checkError } = await supabase
    .from('schedules')
    .select('id, scheduled_start, status, employee_note')
    .eq('employee_id', kimEmployee.id)
    .eq('schedule_date', today)
    .order('scheduled_start', { ascending: true });
  
  if (checkError) {
    console.error('❌ 수정 후 확인 오류:', checkError);
  } else {
    console.log(`✅ 수정 후 스케줄 상태:`);
    updatedSchedules?.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.scheduled_start} - 상태: ${schedule.status} (${schedule.employee_note || '메모 없음'})`);
    });
  }
}

fixKimBreakReturn().catch(console.error);
