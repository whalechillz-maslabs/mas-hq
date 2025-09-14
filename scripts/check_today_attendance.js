const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkTodayAttendance() {
  console.log('🔍 오늘 출근 데이터 확인 시작...\n');

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 오늘 날짜: ${today}`);

    // 1. 오늘 attendance 데이터 확인
    console.log('\n1️⃣ 오늘 attendance 데이터 확인...');
    const { data: todayAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);

    if (attendanceError) {
      console.log('❌ 오늘 attendance 데이터 조회 실패:', attendanceError.message);
    } else {
      console.log(`✅ 오늘 attendance 데이터: ${todayAttendance.length}개`);
      if (todayAttendance.length > 0) {
        todayAttendance.forEach((record, index) => {
          console.log(`   ${index + 1}. 직원ID: ${record.employee_id}, 출근: ${record.check_in_time}, 퇴근: ${record.check_out_time || '미퇴근'}`);
        });
      } else {
        console.log('   📝 오늘 출근 데이터가 없습니다.');
      }
    }

    // 2. 최근 3일 attendance 데이터 확인
    console.log('\n2️⃣ 최근 3일 attendance 데이터 확인...');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    const { data: recentAttendance, error: recentError } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', threeDaysAgoStr)
      .order('date', { ascending: false });

    if (recentError) {
      console.log('❌ 최근 attendance 데이터 조회 실패:', recentError.message);
    } else {
      console.log(`✅ 최근 3일 attendance 데이터: ${recentAttendance.length}개`);
      if (recentAttendance.length > 0) {
        recentAttendance.forEach((record, index) => {
          console.log(`   ${index + 1}. 날짜: ${record.date}, 직원ID: ${record.employee_id}, 출근: ${record.check_in_time}, 퇴근: ${record.check_out_time || '미퇴근'}`);
        });
      }
    }

    // 3. 직원별 오늘 스케줄 확인
    console.log('\n3️⃣ 직원별 오늘 스케줄 확인...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('is_active', true);

    if (employeesError) {
      console.log('❌ 직원 목록 조회 실패:', employeesError.message);
    } else {
      console.log(`✅ 활성 직원 수: ${employees.length}명`);
      
      for (const employee of employees) {
        const { data: todaySchedule, error: scheduleError } = await supabase
          .from('schedules')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('schedule_date', today);

        if (scheduleError) {
          console.log(`   ❌ ${employee.name} 오늘 스케줄 조회 실패: ${scheduleError.message}`);
        } else {
          console.log(`   📋 ${employee.name} (${employee.employee_id}): ${todaySchedule.length}개 스케줄`);
          if (todaySchedule.length > 0) {
            todaySchedule.forEach((schedule, index) => {
              console.log(`      ${index + 1}. ${schedule.scheduled_start} ~ ${schedule.scheduled_end} (상태: ${schedule.status})`);
            });
          }
        }
      }
    }

    // 4. 전체 attendance 테이블 통계
    console.log('\n4️⃣ 전체 attendance 테이블 통계...');
    const { data: allAttendance, error: allError } = await supabase
      .from('attendance')
      .select('*');

    if (allError) {
      console.log('❌ 전체 attendance 데이터 조회 실패:', allError.message);
    } else {
      console.log(`✅ 전체 attendance 레코드 수: ${allAttendance.length}개`);
      
      // 날짜별 통계
      const dateStats = {};
      allAttendance.forEach(record => {
        if (!dateStats[record.date]) {
          dateStats[record.date] = 0;
        }
        dateStats[record.date]++;
      });
      
      console.log('📊 날짜별 출근 통계:');
      Object.entries(dateStats)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([date, count]) => {
          console.log(`   ${date}: ${count}명`);
        });
    }

  } catch (error) {
    console.error('❌ 오늘 출근 데이터 확인 중 오류:', error);
  }
}

// 스크립트 실행
checkTodayAttendance();