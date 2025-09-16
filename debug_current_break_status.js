const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCurrentBreakStatus() {
  console.log('🔍 현재 휴식 상태 및 리로드 문제 분석...\n');

  try {
    // 1. 김탁수 직원 정보 확인
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '김탁수');
    
    if (employeeError) {
      console.error('❌ 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    const kimEmployeeId = employeeData?.[0]?.id;
    if (!kimEmployeeId) {
      console.error('❌ 김탁수 직원 ID를 찾을 수 없습니다.');
      return;
    }

    console.log('👤 김탁수 정보:');
    console.log(`  ID: ${kimEmployeeId}`);
    console.log(`  이름: ${employeeData[0].name}`);
    console.log(`  사번: ${employeeData[0].employee_id}`);

    // 2. 9월 17일 attendance 데이터 확인
    console.log('\n2️⃣ 9월 17일 Attendance 데이터:');
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', kimEmployeeId)
      .eq('date', '2025-09-17');
    
    if (attendanceError) {
      console.error('❌ Attendance 데이터 조회 실패:', attendanceError);
    } else {
      console.log(`📊 김탁수 9월 17일 Attendance 레코드 수: ${attendanceData?.length || 0}`);
      attendanceData?.forEach((record, index) => {
        console.log(`\n  레코드 ${index + 1}:`);
        console.log(`    employee_id: ${record.employee_id}`);
        console.log(`    date: ${record.date}`);
        console.log(`    check_in_time: ${record.check_in_time}`);
        console.log(`    check_out_time: ${record.check_out_time}`);
        console.log(`    total_hours: ${record.total_hours}`);
        console.log(`    status: ${record.status}`);
        console.log(`    notes: ${record.notes}`);
        console.log(`    created_at: ${record.created_at}`);
        console.log(`    updated_at: ${record.updated_at}`);
        
        // 휴식 상태 분석
        if (record.notes) {
          console.log(`    → 휴식 정보 분석:`);
          
          // 휴식 시작 시각들 추출
          const breakStartMatches = record.notes.match(/휴식 시작: (\d{2}:\d{2})/g);
          if (breakStartMatches) {
            console.log(`      - 휴식 시작 기록: ${breakStartMatches.length}개`);
            breakStartMatches.forEach((match, idx) => {
              const timeMatch = match.match(/휴식 시작: (\d{2}:\d{2})/);
              if (timeMatch) {
                console.log(`        ${idx + 1}. ${timeMatch[1]}`);
              }
            });
          }
          
          // 휴식 종료 시각들 추출
          const breakEndMatches = record.notes.match(/휴식 후 복귀: (\d{2}:\d{2})/g);
          if (breakEndMatches) {
            console.log(`      - 휴식 종료 기록: ${breakEndMatches.length}개`);
            breakEndMatches.forEach((match, idx) => {
              const timeMatch = match.match(/휴식 후 복귀: (\d{2}:\d{2})/);
              if (timeMatch) {
                console.log(`        ${idx + 1}. ${timeMatch[1]}`);
              }
            });
          }
          
          // 현재 휴식 중인지 확인
          const lastBreakStart = record.notes.lastIndexOf('휴식 시작:');
          const lastBreakEnd = record.notes.lastIndexOf('휴식 후 복귀:');
          
          if (lastBreakStart > lastBreakEnd) {
            console.log(`      - 현재 상태: 휴식 중 (마지막 휴식 시작이 더 최근)`);
          } else if (lastBreakEnd > lastBreakStart) {
            console.log(`      - 현재 상태: 휴식 완료 (마지막 휴식 종료가 더 최근)`);
          } else {
            console.log(`      - 현재 상태: 휴식 기록 없음`);
          }
        } else {
          console.log(`    → 휴식 정보: 없음`);
        }
      });
    }

    // 3. 9월 17일 schedules 데이터 확인
    console.log('\n3️⃣ 9월 17일 Schedules 데이터:');
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', kimEmployeeId)
      .eq('schedule_date', '2025-09-17');
    
    if (schedulesError) {
      console.error('❌ Schedules 데이터 조회 실패:', schedulesError);
    } else {
      console.log(`📊 김탁수 9월 17일 Schedules 레코드 수: ${schedulesData?.length || 0}`);
      schedulesData?.forEach((record, index) => {
        console.log(`\n  레코드 ${index + 1}:`);
        console.log(`    employee_id: ${record.employee_id}`);
        console.log(`    schedule_date: ${record.schedule_date}`);
        console.log(`    scheduled_start: ${record.scheduled_start}`);
        console.log(`    scheduled_end: ${record.scheduled_end}`);
        console.log(`    actual_start: ${record.actual_start}`);
        console.log(`    actual_end: ${record.actual_end}`);
        console.log(`    status: ${record.status}`);
        console.log(`    employee_note: ${record.employee_note}`);
        console.log(`    created_at: ${record.created_at}`);
        console.log(`    updated_at: ${record.updated_at}`);
      });
    }

    // 4. 휴식 기록 복원 시뮬레이션
    console.log('\n4️⃣ 휴식 기록 복원 시뮬레이션:');
    
    if (attendanceData && attendanceData.length > 0) {
      const attendance = attendanceData[0];
      
      if (attendance.notes) {
        const breakRecords = [];
        
        // 모든 휴식 시작 시각 추출
        const breakStartMatches = attendance.notes.match(/휴식 시작: (\d{2}:\d{2})/g);
        if (breakStartMatches) {
          breakStartMatches.forEach((match) => {
            const timeMatch = match.match(/휴식 시작: (\d{2}:\d{2})/);
            if (timeMatch) {
              breakRecords.push({
                type: 'start',
                time: timeMatch[1],
                timestamp: attendance.updated_at
              });
            }
          });
        }
        
        // 모든 휴식 종료 시각 추출
        const breakEndMatches = attendance.notes.match(/휴식 후 복귀: (\d{2}:\d{2})/g);
        if (breakEndMatches) {
          breakEndMatches.forEach((match) => {
            const timeMatch = match.match(/휴식 후 복귀: (\d{2}:\d{2})/);
            if (timeMatch) {
              breakRecords.push({
                type: 'end',
                time: timeMatch[1],
                timestamp: attendance.updated_at
              });
            }
          });
        }
        
        console.log(`📊 복원된 휴식 기록 (총 ${breakRecords.length}개):`);
        breakRecords.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.type === 'start' ? '휴식 시작' : '휴식 종료'}: ${record.time}`);
        });
        
        // 현재 휴식 상태
        const lastBreakStart = attendance.notes.lastIndexOf('휴식 시작:');
        const lastBreakEnd = attendance.notes.lastIndexOf('휴식 후 복귀:');
        
        if (lastBreakStart > lastBreakEnd) {
          console.log(`\n현재 휴식 상태: 휴식 중`);
          console.log(`관리자 페이지에서 "휴식 중: 1명"으로 표시되어야 함`);
        } else if (lastBreakEnd > lastBreakStart) {
          console.log(`\n현재 휴식 상태: 휴식 완료`);
          console.log(`관리자 페이지에서 "휴식 중: 0명"으로 표시되어야 함`);
        } else {
          console.log(`\n현재 휴식 상태: 휴식 기록 없음`);
        }
      } else {
        console.log('❌ 휴식 정보가 없어서 복원할 수 없습니다.');
      }
    } else {
      console.log('❌ attendance 데이터가 없어서 복원할 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 전체 프로세스 오류:', error);
  }
}

debugCurrentBreakStatus();
