const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocationData() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`🔍 ${today} 위치 정보 데이터 확인...`);
  
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
  
  // attendance 테이블에서 위치 정보 확인
  console.log('\n📊 attendance 테이블 위치 정보:');
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
    console.log(`  위치 정보:`, JSON.stringify(attendance.location, null, 2));
    
    if (attendance.location) {
      console.log(`  📍 위치 상세:`);
      console.log(`    위도: ${attendance.location.latitude}`);
      console.log(`    경도: ${attendance.location.longitude}`);
      console.log(`    정확도: ${attendance.location.accuracy}`);
      console.log(`    타임스탬프: ${attendance.location.timestamp}`);
      console.log(`    메모: ${attendance.location.note || '없음'}`);
    }
  } else {
    console.log('📝 attendance 데이터 없음');
  }
  
  // schedules 테이블에서 위치 정보 확인
  console.log('\n📅 schedules 테이블 위치 정보:');
  const { data: schedules, error: schedulesError } = await supabase
    .from('schedules')
    .select('id, scheduled_start, check_in_location, check_out_location, employee_note')
    .eq('employee_id', kimEmployee.id)
    .eq('schedule_date', today)
    .order('scheduled_start', { ascending: true });
  
  if (schedulesError) {
    console.error('❌ schedules 조회 오류:', schedulesError);
  } else {
    console.log(`✅ schedules 조회 성공: ${schedules?.length || 0}개`);
    
    schedules?.forEach((schedule, index) => {
      console.log(`\n  ${index + 1}. ${schedule.scheduled_start} 스케줄:`);
      console.log(`     출근 위치:`, schedule.check_in_location ? JSON.stringify(schedule.check_in_location, null, 2) : '없음');
      console.log(`     퇴근 위치:`, schedule.check_out_location ? JSON.stringify(schedule.check_out_location, null, 2) : '없음');
      console.log(`     직원 메모: ${schedule.employee_note || '없음'}`);
    });
  }
}

checkLocationData().catch(console.error);
