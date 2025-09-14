const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeLocationLogic() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`🔍 ${today} 위치 정보 로직 분석...`);
  
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
  
  // 1. attendance 테이블 확인 (출근 시 위치 정보)
  console.log('\n📊 1. attendance 테이블 (출근 시 위치 정보):');
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', kimEmployee.id)
    .eq('date', today)
    .single();
  
  if (attendanceError && attendanceError.code !== 'PGRST116') {
    console.error('❌ attendance 조회 오류:', attendanceError);
  } else if (attendance) {
    console.log('✅ attendance 데이터:');
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
  
  // 2. schedules 테이블 확인 (스케줄별 위치 정보)
  console.log('\n📅 2. schedules 테이블 (스케줄별 위치 정보):');
  const { data: schedules, error: schedulesError } = await supabase
    .from('schedules')
    .select('id, scheduled_start, scheduled_end, actual_start, actual_end, status, check_in_location, check_out_location, employee_note')
    .eq('employee_id', kimEmployee.id)
    .eq('schedule_date', today)
    .order('scheduled_start', { ascending: true });
  
  if (schedulesError) {
    console.error('❌ schedules 조회 오류:', schedulesError);
  } else {
    console.log(`✅ schedules 데이터: ${schedules?.length || 0}개`);
    
    // 위치 정보가 있는 스케줄들만 필터링
    const schedulesWithLocation = schedules?.filter(s => 
      s.check_in_location || s.check_out_location
    ) || [];
    
    console.log(`📍 위치 정보가 있는 스케줄: ${schedulesWithLocation.length}개`);
    
    schedulesWithLocation.forEach((schedule, index) => {
      console.log(`\n  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status}):`);
      
      if (schedule.check_in_location) {
        console.log(`    📍 출근 위치:`);
        console.log(`      위도: ${schedule.check_in_location.latitude}`);
        console.log(`      경도: ${schedule.check_in_location.longitude}`);
        console.log(`      정확도: ${schedule.check_in_location.accuracy}`);
        console.log(`      타임스탬프: ${schedule.check_in_location.timestamp}`);
        console.log(`      메모: ${schedule.check_in_location.note || '없음'}`);
      }
      
      if (schedule.check_out_location) {
        console.log(`    📍 퇴근 위치:`);
        console.log(`      위도: ${schedule.check_out_location.latitude}`);
        console.log(`      경도: ${schedule.check_out_location.longitude}`);
        console.log(`      정확도: ${schedule.check_out_location.accuracy}`);
        console.log(`      타임스탬프: ${schedule.check_out_location.timestamp}`);
        console.log(`      메모: ${schedule.check_out_location.note || '없음'}`);
      }
    });
    
    // 위치 정보가 없는 스케줄들
    const schedulesWithoutLocation = schedules?.filter(s => 
      !s.check_in_location && !s.check_out_location
    ) || [];
    
    console.log(`\n❌ 위치 정보가 없는 스케줄: ${schedulesWithoutLocation.length}개`);
    if (schedulesWithoutLocation.length > 0) {
      console.log('  스케줄들:');
      schedulesWithoutLocation.forEach((schedule, index) => {
        console.log(`    ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status})`);
      });
    }
  }
  
  // 3. 로직 분석
  console.log('\n🔍 3. 위치 정보 로직 분석:');
  console.log('현재 시스템의 위치 정보 저장 방식:');
  console.log('  - attendance 테이블: 출근 시 한 번만 위치 정보 저장 (location 필드)');
  console.log('  - schedules 테이블: 각 스케줄별로 출근/퇴근 위치 정보 저장 (check_in_location, check_out_location)');
  console.log('');
  console.log('권장사항:');
  console.log('  ✅ 출근 시 한 번만 위치 정보 저장하는 것이 효율적');
  console.log('  ✅ attendance 테이블의 location 필드만 사용');
  console.log('  ❌ schedules 테이블의 check_in_location, check_out_location은 불필요');
}

analyzeLocationLogic().catch(console.error);
