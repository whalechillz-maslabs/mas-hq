const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAttendanceIssues() {
  const today = '2025-09-15';
  console.log(`🔍 ${today} 출근 체크 문제 분석...`);
  
  // 1. 김탁수 데이터 확인
  console.log('\n📊 1. 김탁수 데이터 확인:');
  const { data: kimEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%김탁수%')
    .single();
  
  if (kimEmployee) {
    console.log(`✅ 김탁수: ${kimEmployee.name} (ID: ${kimEmployee.id})`);
    
    // 김탁수 attendance 데이터
    const { data: kimAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('date', today)
      .single();
    
    if (kimAttendance) {
      console.log('📋 김탁수 attendance 데이터:');
      console.log(`  출근 시간: ${kimAttendance.check_in_time || '없음'}`);
      console.log(`  퇴근 시간: ${kimAttendance.check_out_time || '없음'}`);
      console.log(`  총 근무시간: ${kimAttendance.total_hours || '없음'}`);
      console.log(`  초과근무시간: ${kimAttendance.overtime_hours || '없음'}`);
      console.log(`  상태: ${kimAttendance.status || '없음'}`);
    } else {
      console.log('📝 김탁수 attendance 데이터 없음');
    }
    
    // 김탁수 schedules 데이터
    const { data: kimSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('schedule_date', today)
      .order('scheduled_start', { ascending: true });
    
    console.log(`📅 김탁수 schedules 데이터: ${kimSchedules?.length || 0}개`);
    if (kimSchedules && kimSchedules.length > 0) {
      kimSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status})`);
        console.log(`    실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`    실제 종료: ${schedule.actual_end || '없음'}`);
      });
    }
  }
  
  // 2. 허상원 데이터 확인
  console.log('\n📊 2. 허상원 데이터 확인:');
  const { data: heoEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%허상원%')
    .single();
  
  if (heoEmployee) {
    console.log(`✅ 허상원: ${heoEmployee.name} (ID: ${heoEmployee.id})`);
    
    // 허상원 attendance 데이터
    const { data: heoAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .eq('date', today)
      .single();
    
    if (heoAttendance) {
      console.log('📋 허상원 attendance 데이터:');
      console.log(`  출근 시간: ${heoAttendance.check_in_time || '없음'}`);
      console.log(`  퇴근 시간: ${heoAttendance.check_out_time || '없음'}`);
      console.log(`  총 근무시간: ${heoAttendance.total_hours || '없음'}`);
      console.log(`  초과근무시간: ${heoAttendance.overtime_hours || '없음'}`);
      console.log(`  상태: ${heoAttendance.status || '없음'}`);
    } else {
      console.log('📝 허상원 attendance 데이터 없음');
    }
    
    // 허상원 schedules 데이터
    const { data: heoSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .eq('schedule_date', today)
      .order('scheduled_start', { ascending: true });
    
    console.log(`📅 허상원 schedules 데이터: ${heoSchedules?.length || 0}개`);
    if (heoSchedules && heoSchedules.length > 0) {
      heoSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status})`);
        console.log(`    실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`    실제 종료: ${schedule.actual_end || '없음'}`);
      });
    }
  }
  
  // 3. 최형호 데이터 확인
  console.log('\n📊 3. 최형호 데이터 확인:');
  const { data: choiEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%최형호%')
    .single();
  
  if (choiEmployee) {
    console.log(`✅ 최형호: ${choiEmployee.name} (ID: ${choiEmployee.id})`);
    
    // 최형호 attendance 데이터
    const { data: choiAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('date', today)
      .single();
    
    if (choiAttendance) {
      console.log('📋 최형호 attendance 데이터:');
      console.log(`  출근 시간: ${choiAttendance.check_in_time || '없음'}`);
      console.log(`  퇴근 시간: ${choiAttendance.check_out_time || '없음'}`);
      console.log(`  총 근무시간: ${choiAttendance.total_hours || '없음'}`);
      console.log(`  초과근무시간: ${choiAttendance.overtime_hours || '없음'}`);
      console.log(`  상태: ${choiAttendance.status || '없음'}`);
    } else {
      console.log('📝 최형호 attendance 데이터 없음');
    }
    
    // 최형호 schedules 데이터
    const { data: choiSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('schedule_date', today)
      .order('scheduled_start', { ascending: true });
    
    console.log(`📅 최형호 schedules 데이터: ${choiSchedules?.length || 0}개`);
    if (choiSchedules && choiSchedules.length > 0) {
      choiSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status})`);
        console.log(`    실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`    실제 종료: ${schedule.actual_end || '없음'}`);
      });
    }
  }
  
  // 4. 시간 계산 로직 분석
  console.log('\n🔍 4. 시간 계산 로직 분석:');
  console.log('현재 시간:', new Date().toISOString());
  console.log('오늘 날짜:', today);
  
  // 김탁수의 경우 -9h -58m가 나오는 이유 분석
  if (kimEmployee) {
    const { data: kimAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('date', today)
      .single();
      
    if (kimAttendance) {
    const checkInTime = kimAttendance.check_in_time;
    if (checkInTime) {
      const now = new Date();
      const checkInDateTime = new Date(`${today}T${checkInTime}`);
      
      console.log(`\n⏰ 김탁수 시간 계산:`);
      console.log(`  출근 시간: ${checkInDateTime.toISOString()}`);
      console.log(`  현재 시간: ${now.toISOString()}`);
      
      const diffMs = now.getTime() - checkInDateTime.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log(`  시간 차이: ${diffHours}시간 ${diffMinutes}분`);
      
      if (diffMs < 0) {
        console.log(`  ❌ 음수 시간 발생: 출근 시간이 현재 시간보다 미래`);
      }
    }
    }
  }
}

analyzeAttendanceIssues().catch(console.error);
