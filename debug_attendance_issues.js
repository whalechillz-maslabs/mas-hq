const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAttendanceIssues() {
  console.log('🔍 출근관리 문제 디버깅 시작...');
  
  // 현재 시간 확인
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  console.log('🕐 현재 시간 정보:');
  console.log(`  UTC: ${now.toISOString()}`);
  console.log(`  한국 시간: ${koreaTime.toISOString()}`);
  console.log(`  한국 날짜: ${koreaTime.toISOString().split('T')[0]}`);
  
  const today = koreaTime.toISOString().split('T')[0];
  const yesterday = new Date(koreaTime.getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0];
  
  console.log(`\n📅 날짜 정보:`);
  console.log(`  오늘: ${today}`);
  console.log(`  어제: ${yesterday}`);
  
  // 김탁수 데이터 확인
  console.log('\n👤 김탁수 데이터 확인:');
  const { data: kimEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%김탁수%')
    .single();
  
  if (kimEmployee) {
    console.log(`✅ 김탁수: ${kimEmployee.name} (ID: ${kimEmployee.id})`);
    
    // 오늘 attendance 데이터
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('date', today)
      .single();
    
    console.log(`\n📋 오늘(${today}) attendance 데이터:`);
    if (todayAttendance) {
      console.log(`  출근 시간: ${todayAttendance.check_in_time || '없음'}`);
      console.log(`  퇴근 시간: ${todayAttendance.check_out_time || '없음'}`);
      console.log(`  총 근무시간: ${todayAttendance.total_hours || '없음'}`);
      console.log(`  초과근무시간: ${todayAttendance.overtime_hours || '없음'}`);
      console.log(`  상태: ${todayAttendance.status || '없음'}`);
      console.log(`  휴식 시작: ${todayAttendance.break_start_time || '없음'}`);
      console.log(`  휴식 종료: ${todayAttendance.break_end_time || '없음'}`);
    } else {
      console.log('  📝 오늘 attendance 데이터 없음');
    }
    
    // 어제 attendance 데이터
    const { data: yesterdayAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('date', yesterday)
      .single();
    
    console.log(`\n📋 어제(${yesterday}) attendance 데이터:`);
    if (yesterdayAttendance) {
      console.log(`  출근 시간: ${yesterdayAttendance.check_in_time || '없음'}`);
      console.log(`  퇴근 시간: ${yesterdayAttendance.check_out_time || '없음'}`);
      console.log(`  총 근무시간: ${yesterdayAttendance.total_hours || '없음'}`);
      console.log(`  초과근무시간: ${yesterdayAttendance.overtime_hours || '없음'}`);
      console.log(`  상태: ${yesterdayAttendance.status || '없음'}`);
      console.log(`  휴식 시작: ${yesterdayAttendance.break_start_time || '없음'}`);
      console.log(`  휴식 종료: ${yesterdayAttendance.break_end_time || '없음'}`);
    } else {
      console.log('  📝 어제 attendance 데이터 없음');
    }
    
    // 오늘 schedules 데이터
    const { data: todaySchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('schedule_date', today)
      .order('scheduled_start', { ascending: true });
    
    console.log(`\n📅 오늘(${today}) schedules 데이터: ${todaySchedules?.length || 0}개`);
    if (todaySchedules && todaySchedules.length > 0) {
      todaySchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status})`);
        console.log(`    실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`    실제 종료: ${schedule.actual_end || '없음'}`);
        console.log(`    휴식 시작: ${schedule.break_start || '없음'}`);
        console.log(`    휴식 종료: ${schedule.break_end || '없음'}`);
      });
    }
    
    // 어제 schedules 데이터
    const { data: yesterdaySchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('schedule_date', yesterday)
      .order('scheduled_start', { ascending: true });
    
    console.log(`\n📅 어제(${yesterday}) schedules 데이터: ${yesterdaySchedules?.length || 0}개`);
    if (yesterdaySchedules && yesterdaySchedules.length > 0) {
      yesterdaySchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status})`);
        console.log(`    실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`    실제 종료: ${schedule.actual_end || '없음'}`);
        console.log(`    휴식 시작: ${schedule.break_start || '없음'}`);
        console.log(`    휴식 종료: ${schedule.break_end || '없음'}`);
      });
    }
  }
  
  // 최근 3일간 모든 attendance 데이터 확인
  console.log('\n📊 최근 3일간 attendance 데이터:');
  for (let i = 0; i < 3; i++) {
    const checkDate = new Date(koreaTime.getTime() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', checkDate)
      .order('created_at', { ascending: false });
    
    console.log(`\n  ${checkDate}: ${attendanceData?.length || 0}개 기록`);
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((att, index) => {
        console.log(`    ${index + 1}. ${att.employee_id} - ${att.check_in_time || '출근없음'} ~ ${att.check_out_time || '퇴근없음'} (${att.status})`);
      });
    }
  }
}

debugAttendanceIssues().catch(console.error);
