const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkAttendanceData() {
  console.log('🔍 출근 체크 데이터 상태 점검 시작...\n');

  try {
    // 1. attendance 테이블 존재 여부 확인
    console.log('1️⃣ attendance 테이블 확인 중...');
    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .limit(5);

      if (attendanceError) {
        console.log('❌ attendance 테이블 오류:', attendanceError.message);
      } else {
        console.log('✅ attendance 테이블 존재');
        console.log(`   📊 attendance 레코드 수: ${attendanceData.length}개`);
        if (attendanceData.length > 0) {
          console.log('   📋 최근 attendance 데이터:');
          attendanceData.forEach((record, index) => {
            console.log(`      ${index + 1}. 직원ID: ${record.employee_id}, 날짜: ${record.date}, 출근: ${record.check_in_time}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ attendance 테이블 접근 실패:', error.message);
    }

    // 2. schedules 테이블 확인 (출근 체크와 연관)
    console.log('\n2️⃣ schedules 테이블 확인 중...');
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .order('schedule_date', { ascending: false })
      .limit(10);

    if (schedulesError) {
      console.log('❌ schedules 테이블 오류:', schedulesError.message);
    } else {
      console.log('✅ schedules 테이블 접근 성공');
      console.log(`   📊 schedules 레코드 수: ${schedulesData.length}개`);
      if (schedulesData.length > 0) {
        console.log('   📋 최근 schedules 데이터:');
        schedulesData.forEach((record, index) => {
          console.log(`      ${index + 1}. 직원ID: ${record.employee_id}, 날짜: ${record.schedule_date}, 시작: ${record.scheduled_start}, 종료: ${record.scheduled_end}`);
        });
      }
    }

    // 3. employees 테이블 확인
    console.log('\n3️⃣ employees 테이블 확인 중...');
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, employee_id, phone, status')
      .eq('status', 'active');

    if (employeesError) {
      console.log('❌ employees 테이블 오류:', employeesError.message);
    } else {
      console.log('✅ employees 테이블 접근 성공');
      console.log(`   📊 활성 직원 수: ${employeesData.length}명`);
      console.log('   📋 활성 직원 목록:');
      employeesData.forEach((employee, index) => {
        console.log(`      ${index + 1}. ${employee.name} (${employee.employee_id}) - ${employee.phone}`);
      });
    }

    // 4. 오늘 날짜 기준 스케줄 확인
    console.log('\n4️⃣ 오늘 날짜 기준 스케줄 확인...');
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySchedules, error: todayError } = await supabase
      .from('schedules')
      .select('*, employees(name, employee_id)')
      .eq('schedule_date', today);

    if (todayError) {
      console.log('❌ 오늘 스케줄 조회 오류:', todayError.message);
    } else {
      console.log(`✅ 오늘(${today}) 스케줄 조회 성공`);
      console.log(`   📊 오늘 스케줄 수: ${todaySchedules.length}개`);
      if (todaySchedules.length > 0) {
        console.log('   📋 오늘 스케줄 목록:');
        todaySchedules.forEach((schedule, index) => {
          console.log(`      ${index + 1}. ${schedule.employees?.name} (${schedule.employees?.employee_id}) - ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
        });
      } else {
        console.log('   ⚠️  오늘 등록된 스케줄이 없습니다.');
      }
    }

    // 5. 최근 7일간 출근 관련 데이터 확인
    console.log('\n5️⃣ 최근 7일간 출근 관련 데이터 확인...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: recentSchedules, error: recentError } = await supabase
      .from('schedules')
      .select('*, employees(name, employee_id)')
      .gte('schedule_date', sevenDaysAgoStr)
      .order('schedule_date', { ascending: false });

    if (recentError) {
      console.log('❌ 최근 스케줄 조회 오류:', recentError.message);
    } else {
      console.log(`✅ 최근 7일간 스케줄 조회 성공`);
      console.log(`   📊 최근 7일간 스케줄 수: ${recentSchedules.length}개`);
      
      // 날짜별 그룹화
      const schedulesByDate = {};
      recentSchedules.forEach(schedule => {
        const date = schedule.schedule_date;
        if (!schedulesByDate[date]) {
          schedulesByDate[date] = [];
        }
        schedulesByDate[date].push(schedule);
      });

      console.log('   📋 날짜별 스케줄:');
      Object.keys(schedulesByDate).sort().reverse().forEach(date => {
        console.log(`      ${date}: ${schedulesByDate[date].length}개 스케줄`);
        schedulesByDate[date].forEach(schedule => {
          console.log(`         - ${schedule.employees?.name}: ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
        });
      });
    }

    console.log('\n🎯 점검 완료!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 점검 중 오류 발생:', error);
  }
}

// 스크립트 실행
checkAttendanceData();
