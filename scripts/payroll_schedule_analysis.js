const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function analyzeSchedulesForPayroll() {
  console.log('=== 급여 정산용 스케줄 분석 ===');
  
  try {
    // 1. 특정 기간의 completed 스케줄 조회
    const startDate = '2025-09-01';
    const endDate = '2025-09-30';
    
    console.log(`📅 분석 기간: ${startDate} ~ ${endDate}`);
    
    const { data: completedSchedules, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .eq('status', 'completed')
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date, employee_id');
    
    if (scheduleError) {
      console.error('스케줄 조회 실패:', scheduleError);
      return;
    }
    
    console.log(`\n📊 완료된 스케줄 총 ${completedSchedules.length}개`);
    
    // 2. 출근 기록 조회
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (attendanceError) {
      console.error('출근 기록 조회 실패:', attendanceError);
      return;
    }
    
    console.log(`📊 출근 기록 총 ${attendanceRecords.length}개`);
    
    // 3. 스케줄별 출근 기록 매칭 및 분석
    const analysis = {
      withAttendance: [], // 출근 기록 있는 스케줄
      withoutAttendance: [], // 출근 기록 없는 스케줄
      totalHours: 0,
      totalHoursWithAttendance: 0,
      totalHoursWithoutAttendance: 0
    };
    
    for (const schedule of completedSchedules) {
      // 해당 날짜의 출근 기록 찾기
      const attendance = attendanceRecords.find(record => 
        record.employee_id === schedule.employee_id && 
        record.date === schedule.schedule_date
      );
      
      // 근무 시간 계산 (시간 단위)
      const startTime = new Date(`2000-01-01T${schedule.scheduled_start}`);
      const endTime = new Date(`2000-01-01T${schedule.scheduled_end}`);
      const workHours = (endTime - startTime) / (1000 * 60 * 60);
      
      const scheduleData = {
        id: schedule.id,
        employee: schedule.employee?.name || '알 수 없음',
        date: schedule.schedule_date,
        startTime: schedule.scheduled_start,
        endTime: schedule.scheduled_end,
        workHours: workHours,
        hasAttendance: !!attendance,
        attendanceCheckIn: attendance?.check_in_time || null,
        attendanceCheckOut: attendance?.check_out_time || null,
        note: schedule.employee_note || ''
      };
      
      if (attendance) {
        analysis.withAttendance.push(scheduleData);
        analysis.totalHoursWithAttendance += workHours;
      } else {
        analysis.withoutAttendance.push(scheduleData);
        analysis.totalHoursWithoutAttendance += workHours;
      }
      
      analysis.totalHours += workHours;
    }
    
    // 4. 결과 출력
    console.log('\n📈 분석 결과:');
    console.log(`✅ 출근 기록 있는 스케줄: ${analysis.withAttendance.length}개 (${analysis.totalHoursWithAttendance.toFixed(1)}시간)`);
    console.log(`⚠️ 출근 기록 없는 스케줄: ${analysis.withoutAttendance.length}개 (${analysis.totalHoursWithoutAttendance.toFixed(1)}시간)`);
    console.log(`📊 총 근무 시간: ${analysis.totalHours.toFixed(1)}시간`);
    
    // 5. 직원별 상세 분석
    const employeeAnalysis = {};
    
    [...analysis.withAttendance, ...analysis.withoutAttendance].forEach(schedule => {
      const empName = schedule.employee;
      if (!employeeAnalysis[empName]) {
        employeeAnalysis[empName] = {
          totalHours: 0,
          hoursWithAttendance: 0,
          hoursWithoutAttendance: 0,
          scheduleCount: 0,
          schedules: []
        };
      }
      
      employeeAnalysis[empName].totalHours += schedule.workHours;
      employeeAnalysis[empName].scheduleCount += 1;
      employeeAnalysis[empName].schedules.push(schedule);
      
      if (schedule.hasAttendance) {
        employeeAnalysis[empName].hoursWithAttendance += schedule.workHours;
      } else {
        employeeAnalysis[empName].hoursWithoutAttendance += schedule.workHours;
      }
    });
    
    console.log('\n👥 직원별 상세 분석:');
    Object.entries(employeeAnalysis).forEach(([empName, data]) => {
      console.log(`\n📋 ${empName}:`);
      console.log(`  - 총 근무 시간: ${data.totalHours.toFixed(1)}시간 (${data.scheduleCount}개 스케줄)`);
      console.log(`  - 출근 기록 있음: ${data.hoursWithAttendance.toFixed(1)}시간`);
      console.log(`  - 출근 기록 없음: ${data.hoursWithoutAttendance.toFixed(1)}시간`);
      
      if (data.hoursWithoutAttendance > 0) {
        console.log(`  ⚠️ 출근 기록 없는 스케줄:`);
        data.schedules
          .filter(s => !s.hasAttendance)
          .forEach(s => {
            console.log(`    - ${s.date}: ${s.startTime}~${s.endTime} (${s.workHours}시간)`);
          });
      }
    });
    
    // 6. 급여 정산 권장사항
    console.log('\n💰 급여 정산 권장사항:');
    console.log('1. 출근 기록 있는 스케줄: 정상 급여 지급');
    console.log('2. 출근 기록 없는 스케줄: 관리자 확인 후 급여 지급 여부 결정');
    console.log('3. 출근 기록 없는 스케줄은 메모에 "급여 정산 대상"으로 표시됨');
    
    console.log('\n=== 급여 정산용 스케줄 분석 완료 ===');
    
  } catch (error) {
    console.error('급여 정산용 스케줄 분석 오류:', error);
  }
}

// 스크립트 실행
analyzeSchedulesForPayroll().catch(console.error);
