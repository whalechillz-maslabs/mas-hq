const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLocationDisplay() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`🔍 ${today} 위치 정보 표시 문제 디버깅...`);
  
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
  
  // 1. attendance 테이블 확인
  console.log('\n📊 1. attendance 테이블:');
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
  } else {
    console.log('📝 attendance 데이터 없음');
  }
  
  // 2. schedules 테이블 확인
  console.log('\n📅 2. schedules 테이블:');
  const { data: schedules, error: schedulesError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', kimEmployee.id)
    .eq('schedule_date', today)
    .order('scheduled_start', { ascending: true });
  
  if (schedulesError) {
    console.error('❌ schedules 조회 오류:', schedulesError);
  } else {
    console.log(`✅ schedules 데이터: ${schedules?.length || 0}개`);
    if (schedules && schedules.length > 0) {
      schedules.forEach((schedule, index) => {
        console.log(`\n  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status}):`);
        console.log(`    실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`    실제 종료: ${schedule.actual_end || '없음'}`);
        console.log(`    출근 위치:`, JSON.stringify(schedule.check_in_location, null, 2));
        console.log(`    퇴근 위치:`, JSON.stringify(schedule.check_out_location, null, 2));
        if (schedule.employee_note) console.log(`    메모: ${schedule.employee_note}`);
      });
    }
  }
  
  // 3. 관리자 페이지에서 사용하는 데이터 구조 분석
  console.log('\n🔍 3. 관리자 페이지 데이터 구조 분석:');
  
  // attendance 데이터를 schedules 형식으로 변환 (관리자 페이지 로직과 동일)
  if (attendance) {
    const convertedRecord = {
      id: `attendance-${attendance.id}`,
      employee_id: attendance.employee_id,
      schedule_date: attendance.date,
      scheduled_start: '09:00:00', // 기본값
      scheduled_end: '18:00:00', // 기본값
      actual_start: attendance.check_in_time ? `${attendance.date}T${attendance.check_in_time}` : null,
      actual_end: attendance.check_out_time ? `${attendance.date}T${attendance.check_out_time}` : null,
      status: attendance.status,
      check_in_location: attendance.location,
      check_out_location: null, // 퇴근 시에는 위치 정보 저장하지 않음
      employee_note: null,
      total_hours: attendance.total_hours,
      overtime_hours: attendance.overtime_hours
    };
    
    console.log('📋 변환된 레코드:');
    console.log(`  출근 위치:`, JSON.stringify(convertedRecord.check_in_location, null, 2));
    console.log(`  퇴근 위치:`, JSON.stringify(convertedRecord.check_out_location, null, 2));
    
    // 위치 정보 표시 로직 시뮬레이션
    console.log('\n🎯 위치 정보 표시 로직 시뮬레이션:');
    
    // 실제 출근 컬럼
    if (convertedRecord.check_in_location) {
      console.log('✅ 실제 출근 위치 정보 있음:', convertedRecord.check_in_location.note || 'GPS 위치');
    } else {
      console.log('❌ 실제 출근 위치 정보 없음');
    }
    
    // 실제 퇴근 컬럼
    if (convertedRecord.check_out_location) {
      console.log('✅ 실제 퇴근 위치 정보 있음:', convertedRecord.check_out_location.note || 'GPS 위치');
    } else {
      console.log('❌ 실제 퇴근 위치 정보 없음 (예상됨)');
    }
    
    // 위치 컬럼
    if (convertedRecord.check_in_location) {
      console.log('✅ 위치 컬럼 정보 있음:', convertedRecord.check_in_location.note || 'GPS 위치');
    } else {
      console.log('❌ 위치 컬럼 정보 없음');
    }
  }
}

debugLocationDisplay().catch(console.error);
