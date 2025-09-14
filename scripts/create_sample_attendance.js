const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createSampleAttendance() {
  console.log('🔧 샘플 출근 데이터 생성 시작...\n');

  try {
    // 1. 직원 목록 조회
    console.log('1️⃣ 직원 목록 조회 중...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('status', 'active');

    if (employeesError) {
      console.log('❌ 직원 목록 조회 실패:', employeesError.message);
      return;
    }

    console.log(`✅ ${employees.length}명의 활성 직원 조회 완료`);
    employees.forEach(emp => {
      console.log(`   - ${emp.name} (${emp.employee_id})`);
    });

    // 2. 최근 7일간의 출근 데이터 생성
    console.log('\n2️⃣ 최근 7일간 출근 데이터 생성 중...');
    
    const today = new Date();
    const attendanceData = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 주말 제외 (토요일=6, 일요일=0)
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      employees.forEach(employee => {
        // 랜덤하게 출근/결근 결정 (90% 출근률)
        if (Math.random() > 0.1) {
          const checkInHour = 8 + Math.floor(Math.random() * 2); // 8-9시
          const checkInMinute = Math.floor(Math.random() * 60);
          const checkOutHour = 17 + Math.floor(Math.random() * 3); // 17-19시
          const checkOutMinute = Math.floor(Math.random() * 60);

          const checkInTime = `${checkInHour.toString().padStart(2, '0')}:${checkInMinute.toString().padStart(2, '0')}:00`;
          const checkOutTime = `${checkOutHour.toString().padStart(2, '0')}:${checkOutMinute.toString().padStart(2, '0')}:00`;
          
          // 근무시간 계산 (점심시간 1시간 제외)
          const checkInMinutes = checkInHour * 60 + checkInMinute;
          const checkOutMinutes = checkOutHour * 60 + checkOutMinute;
          const totalMinutes = checkOutMinutes - checkInMinutes - 60; // 점심시간 제외
          const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

          attendanceData.push({
            employee_id: employee.id,
            date: dateStr,
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            break_start_time: '12:00:00',
            break_end_time: '13:00:00',
            total_hours: totalHours,
            overtime_hours: totalHours > 8 ? totalHours - 8 : 0,
            status: 'present',
            location: {
              latitude: 37.5665 + (Math.random() - 0.5) * 0.01,
              longitude: 126.9780 + (Math.random() - 0.5) * 0.01,
              address: '서울시 중구'
            }
          });
        }
      });
    }

    console.log(`📊 생성할 출근 데이터: ${attendanceData.length}개`);

    // 3. 데이터 삽입 (attendance 테이블이 존재하는 경우에만)
    console.log('\n3️⃣ 출근 데이터 삽입 시도...');
    
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select();

      if (insertError) {
        console.log('❌ 출근 데이터 삽입 실패:', insertError.message);
        console.log('   💡 attendance 테이블이 아직 생성되지 않았을 수 있습니다.');
      } else {
        console.log(`✅ ${insertData.length}개의 출근 데이터 삽입 완료!`);
      }
    } catch (insertError) {
      console.log('❌ 출근 데이터 삽입 중 오류:', insertError.message);
    }

    // 4. 생성된 데이터 확인
    console.log('\n4️⃣ 생성된 출근 데이터 확인...');
    try {
      const { data: attendanceRecords, error: checkError } = await supabase
        .from('attendance')
        .select('*, employees(name, employee_id)')
        .order('date', { ascending: false })
        .limit(10);

      if (checkError) {
        console.log('❌ 출근 데이터 확인 실패:', checkError.message);
      } else {
        console.log(`✅ 현재 attendance 테이블 레코드 수: ${attendanceRecords.length}개`);
        if (attendanceRecords.length > 0) {
          console.log('📋 최근 출근 기록:');
          attendanceRecords.forEach((record, index) => {
            console.log(`   ${index + 1}. ${record.employees?.name} - ${record.date} (${record.check_in_time} ~ ${record.check_out_time})`);
          });
        }
      }
    } catch (checkError) {
      console.log('❌ 출근 데이터 확인 중 오류:', checkError.message);
    }

    console.log('\n🎯 샘플 출근 데이터 생성 완료!');

  } catch (error) {
    console.error('❌ 샘플 데이터 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
createSampleAttendance();
