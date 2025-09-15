const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeoChoiAttendance() {
  const today = '2025-09-15';
  console.log(`🔍 ${today} 허상원, 최형호 출근 데이터 확인...`);
  
  // 허상원 데이터 확인
  console.log('\n👤 허상원 데이터 확인:');
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
      console.log(`  생성일시: ${heoAttendance.created_at || '없음'}`);
      console.log(`  수정일시: ${heoAttendance.updated_at || '없음'}`);
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
        console.log(`    생성일시: ${schedule.created_at || '없음'}`);
        console.log(`    수정일시: ${schedule.updated_at || '없음'}`);
      });
    }
  }
  
  // 최형호 데이터 확인
  console.log('\n👤 최형호 데이터 확인:');
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
      console.log(`  생성일시: ${choiAttendance.created_at || '없음'}`);
      console.log(`  수정일시: ${choiAttendance.updated_at || '없음'}`);
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
        console.log(`    생성일시: ${schedule.created_at || '없음'}`);
        console.log(`    수정일시: ${schedule.updated_at || '없음'}`);
      });
    }
  }
  
  // 최근 3일간 모든 attendance 데이터 확인
  console.log('\n📊 최근 3일간 attendance 데이터:');
  for (let i = 0; i < 3; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', dateStr)
      .order('created_at', { ascending: false });
    
    console.log(`\n  ${dateStr}: ${attendanceData?.length || 0}개 기록`);
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((att, index) => {
        console.log(`    ${index + 1}. ${att.employee_id} - ${att.check_in_time || '출근없음'} ~ ${att.check_out_time || '퇴근없음'} (${att.status})`);
        console.log(`       생성: ${att.created_at}`);
      });
    }
  }
}

checkHeoChoiAttendance().catch(console.error);
