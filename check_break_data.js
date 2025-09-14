const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (실제 프로덕션 환경)
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBreakData() {
  try {
    console.log('🔍 현재 휴식 데이터 분석...\n');
    
    // 한국 시간으로 오늘 날짜 계산
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const today = koreaTime.toISOString().split('T')[0];
    
    console.log(`📅 오늘 날짜: ${today}\n`);
    
    // 1. 김탁수의 오늘 schedules 데이터 확인
    console.log('1️⃣ 김탁수의 오늘 schedules 데이터:');
    const { data: kimSchedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', '74d076b8-ffad-4103-8346-127aff1f1305')
      .eq('schedule_date', today)
      .order('scheduled_start', { ascending: true });
    
    if (schedulesError) {
      console.error('❌ schedules 조회 오류:', schedulesError);
    } else {
      console.log(`📊 총 ${kimSchedules.length}개의 스케줄 기록`);
      kimSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. ${schedule.scheduled_start}-${schedule.scheduled_end}`);
        console.log(`     실제: ${schedule.actual_start ? '시작됨' : '미시작'} ${schedule.actual_end ? '종료됨' : '진행중'}`);
        console.log(`     상태: ${schedule.status}`);
        console.log(`     메모: ${schedule.employee_note || '없음'}`);
        console.log('');
      });
    }
    
    // 2. 김탁수의 오늘 attendance 데이터 확인
    console.log('2️⃣ 김탁수의 오늘 attendance 데이터:');
    const { data: kimAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', '74d076b8-ffad-4103-8346-127aff1f1305')
      .eq('date', today);
    
    if (attendanceError) {
      console.error('❌ attendance 조회 오류:', attendanceError);
    } else {
      console.log(`📊 총 ${kimAttendance.length}개의 출근 기록`);
      kimAttendance.forEach((record, index) => {
        console.log(`  ${index + 1}. 출근: ${record.check_in_time || '없음'}`);
        console.log(`     퇴근: ${record.check_out_time || '없음'}`);
        console.log(`     상태: ${record.status}`);
        console.log(`     위치: ${record.location ? '있음' : '없음'}`);
        console.log('');
      });
    }
    
    // 3. break 상태인 schedules 확인
    console.log('3️⃣ break 상태인 schedules 확인:');
    const { data: breakSchedules, error: breakError } = await supabase
      .from('schedules')
      .select('*')
      .eq('status', 'break')
      .eq('schedule_date', today);
    
    if (breakError) {
      console.error('❌ break schedules 조회 오류:', breakError);
    } else {
      console.log(`📊 총 ${breakSchedules.length}개의 휴식 중인 스케줄`);
      breakSchedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}. 직원: ${schedule.employee_id}`);
        console.log(`     시간: ${schedule.scheduled_start}-${schedule.scheduled_end}`);
        console.log(`     실제: ${schedule.actual_start} → ${schedule.actual_end}`);
        console.log(`     메모: ${schedule.employee_note || '없음'}`);
        console.log('');
      });
    }
    
    // 4. 모든 직원의 오늘 상태 요약
    console.log('4️⃣ 모든 직원의 오늘 상태 요약:');
    const { data: allSchedules, error: allError } = await supabase
      .from('schedules')
      .select(`
        *,
        employees!inner(name, employee_id)
      `)
      .eq('schedule_date', today)
      .order('employees(name)', { ascending: true });
    
    if (allError) {
      console.error('❌ 전체 schedules 조회 오류:', allError);
    } else {
      // 직원별로 그룹화
      const employeeStatus = {};
      allSchedules.forEach(schedule => {
        const empName = schedule.employees.name;
        if (!employeeStatus[empName]) {
          employeeStatus[empName] = {
            total: 0,
            inProgress: 0,
            break: 0,
            completed: 0,
            pending: 0
          };
        }
        
        employeeStatus[empName].total++;
        employeeStatus[empName][schedule.status] = (employeeStatus[empName][schedule.status] || 0) + 1;
      });
      
      console.log('📊 직원별 상태 요약:');
      Object.entries(employeeStatus).forEach(([name, status]) => {
        console.log(`  👤 ${name}:`);
        console.log(`     전체: ${status.total}개`);
        console.log(`     진행중: ${status.in_progress || 0}개`);
        console.log(`     휴식중: ${status.break || 0}개`);
        console.log(`     완료: ${status.completed || 0}개`);
        console.log(`     대기: ${status.pending || 0}개`);
        console.log('');
      });
    }
    
    console.log('✅ 휴식 데이터 분석 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkBreakData();
