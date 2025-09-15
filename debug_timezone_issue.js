const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTimezoneIssue() {
  console.log('🔍 시간대 문제 디버깅...');
  
  // 현재 시간 정보
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  console.log('🕐 현재 시간 정보:');
  console.log(`  UTC: ${now.toISOString()}`);
  console.log(`  한국 시간: ${koreaTime.toISOString()}`);
  console.log(`  한국 날짜: ${koreaTime.toISOString().split('T')[0]}`);
  console.log(`  한국 시간: ${koreaTime.toTimeString().split(' ')[0]}`);
  
  const today = koreaTime.toISOString().split('T')[0];
  
  // 허상원 데이터 확인
  console.log('\n👤 허상원 데이터 확인:');
  const { data: heoEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%허상원%')
    .single();
  
  if (heoEmployee) {
    // attendance 데이터
    const { data: heoAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .eq('date', today)
      .single();
    
    if (heoAttendance) {
      console.log('📋 attendance 테이블:');
      console.log(`  출근 시간: ${heoAttendance.check_in_time}`);
      console.log(`  퇴근 시간: ${heoAttendance.check_out_time || '없음'}`);
      console.log(`  생성일시: ${heoAttendance.created_at}`);
      console.log(`  수정일시: ${heoAttendance.updated_at}`);
    } else {
      console.log('📋 attendance 테이블: 없음');
    }
    
    // schedules 데이터
    const { data: heoSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .eq('schedule_date', today)
      .order('scheduled_start', { ascending: true });
    
    if (heoSchedules && heoSchedules.length > 0) {
      console.log('📅 schedules 테이블:');
      heoSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
        console.log(`    실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`    실제 종료: ${schedule.actual_end || '없음'}`);
        console.log(`    생성일시: ${schedule.created_at}`);
        console.log(`    수정일시: ${schedule.updated_at}`);
        
        // 시간 변환 테스트
        if (schedule.actual_start) {
          const utcDate = new Date(schedule.actual_start);
          const koreaDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
          console.log(`    UTC → 한국 시간: ${utcDate.toISOString()} → ${koreaDate.toISOString()}`);
          console.log(`    한국 시간 표시: ${koreaDate.toTimeString().split(' ')[0]}`);
        }
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
    // attendance 데이터
    const { data: choiAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('date', today)
      .single();
    
    if (choiAttendance) {
      console.log('📋 attendance 테이블:');
      console.log(`  출근 시간: ${choiAttendance.check_in_time}`);
      console.log(`  퇴근 시간: ${choiAttendance.check_out_time || '없음'}`);
      console.log(`  생성일시: ${choiAttendance.created_at}`);
      console.log(`  수정일시: ${choiAttendance.updated_at}`);
    } else {
      console.log('📋 attendance 테이블: 없음');
    }
    
    // schedules 데이터
    const { data: choiSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('schedule_date', today)
      .order('scheduled_start', { ascending: true });
    
    if (choiSchedules && choiSchedules.length > 0) {
      console.log('📅 schedules 테이블:');
      choiSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
        console.log(`    실제 시작: ${schedule.actual_start || '없음'}`);
        console.log(`    실제 종료: ${schedule.actual_end || '없음'}`);
        console.log(`    생성일시: ${schedule.created_at}`);
        console.log(`    수정일시: ${schedule.updated_at}`);
        
        // 시간 변환 테스트
        if (schedule.actual_start) {
          const utcDate = new Date(schedule.actual_start);
          const koreaDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
          console.log(`    UTC → 한국 시간: ${utcDate.toISOString()} → ${koreaDate.toISOString()}`);
          console.log(`    한국 시간 표시: ${koreaDate.toTimeString().split(' ')[0]}`);
        }
      });
    }
  }
  
  // 김탁수 데이터 확인
  console.log('\n👤 김탁수 데이터 확인:');
  const { data: kimEmployee } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .ilike('name', '%김탁수%')
    .single();
  
  if (kimEmployee) {
    // attendance 데이터
    const { data: kimAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', kimEmployee.id)
      .eq('date', today)
      .single();
    
    if (kimAttendance) {
      console.log('📋 attendance 테이블:');
      console.log(`  출근 시간: ${kimAttendance.check_in_time}`);
      console.log(`  퇴근 시간: ${kimAttendance.check_out_time || '없음'}`);
      console.log(`  생성일시: ${kimAttendance.created_at}`);
      console.log(`  수정일시: ${kimAttendance.updated_at}`);
      
      // 시간 변환 테스트
      if (kimAttendance.check_in_time) {
        const utcDate = new Date(`${today}T${kimAttendance.check_in_time}`);
        const koreaDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
        console.log(`  UTC → 한국 시간: ${utcDate.toISOString()} → ${koreaDate.toISOString()}`);
        console.log(`  한국 시간 표시: ${koreaDate.toTimeString().split(' ')[0]}`);
      }
    } else {
      console.log('📋 attendance 테이블: 없음');
    }
  }
  
  // 시간대 변환 로직 테스트
  console.log('\n🧪 시간대 변환 로직 테스트:');
  const testTimes = [
    '2025-09-15T08:53:57.464+00:00', // 허상원
    '2025-09-15T08:55:54.683+00:00', // 최형호
    '08:33:43' // 김탁수
  ];
  
  testTimes.forEach((timeStr, index) => {
    console.log(`\n테스트 ${index + 1}: ${timeStr}`);
    
    if (timeStr.includes('T')) {
      // ISO 형식
      const utcDate = new Date(timeStr);
      const koreaDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
      console.log(`  UTC: ${utcDate.toISOString()}`);
      console.log(`  한국: ${koreaDate.toISOString()}`);
      console.log(`  한국 시간: ${koreaDate.toTimeString().split(' ')[0]}`);
    } else {
      // HH:MM:SS 형식
      const utcDate = new Date(`2000-01-01T${timeStr}`);
      const koreaDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
      console.log(`  UTC: ${utcDate.toTimeString().split(' ')[0]}`);
      console.log(`  한국: ${koreaDate.toTimeString().split(' ')[0]}`);
    }
  });
}

debugTimezoneIssue().catch(console.error);
