const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAdminData() {
  console.log('🔍 관리자 페이지 데이터 디버깅 시작...\n');
  
  try {
    const today = '2025-09-16';
    console.log(`📅 조회 날짜: ${today}\n`);
    
    // 1. 스케줄 데이터 조회
    console.log('1️⃣ 스케줄 데이터 조회...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employees (
          id,
          name,
          employee_id,
          employment_type
        )
      `)
      .eq('schedule_date', today)
      .order('scheduled_start', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 스케줄 데이터 조회 실패:', scheduleError);
    } else {
      console.log(`✅ 스케줄 데이터: ${scheduleData?.length || 0}개`);
      if (scheduleData && scheduleData.length > 0) {
        scheduleData.forEach((schedule, index) => {
          console.log(`   ${index + 1}. ${schedule.employees?.name || 'Unknown'} (${schedule.employees?.employee_id || 'No ID'})`);
          console.log(`      - 스케줄: ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
          console.log(`      - 실제: ${schedule.actual_start || 'None'} ~ ${schedule.actual_end || 'None'}`);
          console.log(`      - 상태: ${schedule.status}`);
        });
      }
    }
    
    // 2. 출근 데이터 조회
    console.log('\n2️⃣ 출근 데이터 조회...');
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);
    
    if (attendanceError) {
      console.error('❌ 출근 데이터 조회 실패:', attendanceError);
    } else {
      console.log(`✅ 출근 데이터: ${attendanceData?.length || 0}개`);
      if (attendanceData && attendanceData.length > 0) {
        attendanceData.forEach((attendance, index) => {
          console.log(`   ${index + 1}. Employee ID: ${attendance.employee_id}`);
          console.log(`      - 출근: ${attendance.check_in_time || 'None'}`);
          console.log(`      - 퇴근: ${attendance.check_out_time || 'None'}`);
          console.log(`      - 상태: ${attendance.status}`);
          console.log(`      - 총 근무시간: ${attendance.total_hours || 0}시간`);
        });
      }
    }
    
    // 3. 직원 데이터 조회
    console.log('\n3️⃣ 직원 데이터 조회...');
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id, employment_type')
      .order('name', { ascending: true });
    
    if (employeeError) {
      console.error('❌ 직원 데이터 조회 실패:', employeeError);
    } else {
      console.log(`✅ 직원 데이터: ${employeeData?.length || 0}개`);
      if (employeeData && employeeData.length > 0) {
        employeeData.forEach((employee, index) => {
          console.log(`   ${index + 1}. ${employee.name} (${employee.employee_id}) - ${employee.employment_type || '미지정'}`);
        });
      }
    }
    
    // 4. 최근 출근 기록 확인
    console.log('\n4️⃣ 최근 출근 기록 확인...');
    const { data: recentAttendance, error: recentError } = await supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.error('❌ 최근 출근 기록 조회 실패:', recentError);
    } else {
      console.log(`✅ 최근 출근 기록: ${recentAttendance?.length || 0}개`);
      if (recentAttendance && recentAttendance.length > 0) {
        recentAttendance.forEach((attendance, index) => {
          console.log(`   ${index + 1}. ${attendance.date} - Employee ID: ${attendance.employee_id}`);
          console.log(`      - 출근: ${attendance.check_in_time || 'None'}`);
          console.log(`      - 퇴근: ${attendance.check_out_time || 'None'}`);
        });
      }
    }
    
    // 5. 최근 스케줄 기록 확인
    console.log('\n5️⃣ 최근 스케줄 기록 확인...');
    const { data: recentSchedules, error: recentScheduleError } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentScheduleError) {
      console.error('❌ 최근 스케줄 기록 조회 실패:', recentScheduleError);
    } else {
      console.log(`✅ 최근 스케줄 기록: ${recentSchedules?.length || 0}개`);
      if (recentSchedules && recentSchedules.length > 0) {
        recentSchedules.forEach((schedule, index) => {
          console.log(`   ${index + 1}. ${schedule.schedule_date} - Employee ID: ${schedule.employee_id}`);
          console.log(`      - 스케줄: ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
          console.log(`      - 상태: ${schedule.status}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 전체 오류:', error);
  }
}

debugAdminData();
