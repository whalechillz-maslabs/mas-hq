const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentStatus() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`🔍 ${today} 현재 상태 확인...`);
  
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
  
  // schedules 테이블 확인
  console.log('\n📅 schedules 테이블 상태:');
  const { data: schedules, error: schedulesError } = await supabase
    .from('schedules')
    .select('id, scheduled_start, scheduled_end, status, actual_start, actual_end, employee_note')
    .eq('employee_id', kimEmployee.id)
    .eq('schedule_date', today)
    .order('scheduled_start', { ascending: true });
  
  if (schedulesError) {
    console.error('❌ schedules 조회 오류:', schedulesError);
  } else {
    console.log(`✅ schedules 조회 성공: ${schedules?.length || 0}개`);
    
    // 상태별 개수 확인
    const statusCounts = schedules?.reduce((acc, schedule) => {
      acc[schedule.status] = (acc[schedule.status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    console.log('📊 상태별 개수:', statusCounts);
    
    // break 상태인 스케줄들 상세 확인
    const breakSchedules = schedules?.filter(s => s.status === 'break') || [];
    if (breakSchedules.length > 0) {
      console.log(`\n⚠️ break 상태인 스케줄 ${breakSchedules.length}개:`);
      breakSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
        console.log(`     상태: ${schedule.status}`);
        console.log(`     실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`     실제 종료: ${schedule.actual_end || '없음'}`);
        console.log(`     직원 메모: ${schedule.employee_note || '없음'}`);
        console.log('');
      });
    }
    
    // in_progress 상태인 스케줄들 확인
    const inProgressSchedules = schedules?.filter(s => s.status === 'in_progress') || [];
    if (inProgressSchedules.length > 0) {
      console.log(`\n✅ in_progress 상태인 스케줄 ${inProgressSchedules.length}개:`);
      inProgressSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
        console.log(`     상태: ${schedule.status}`);
        console.log(`     실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`     직원 메모: ${schedule.employee_note || '없음'}`);
        console.log('');
      });
    }
  }
  
  // attendance 테이블 확인
  console.log('\n📊 attendance 테이블:');
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', kimEmployee.id)
    .eq('date', today)
    .single();
  
  if (attendanceError && attendanceError.code !== 'PGRST116') {
    console.error('❌ attendance 조회 오류:', attendanceError);
  } else if (attendance) {
    console.log('✅ attendance 조회 성공:');
    console.log(`  출근 시간: ${attendance.check_in_time || '없음'}`);
    console.log(`  퇴근 시간: ${attendance.check_out_time || '없음'}`);
    console.log(`  상태: ${attendance.status || '없음'}`);
    console.log(`  직원 메모: ${attendance.employee_note || '없음'}`);
  } else {
    console.log('📝 attendance 데이터 없음');
  }
}

checkCurrentStatus().catch(console.error);
