const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKimAttendance() {
  console.log('🔍 김탁수 9월 17일 출근 및 휴식 상태 분석...\n');

  try {
    // 1. 김탁수 직원 정보 확인
    console.log('1️⃣ 김탁수 직원 정보:');
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '김탁수');
    
    if (employeeError) {
      console.error('❌ 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    console.log('👤 김탁수 정보:');
    employeeData?.forEach(emp => {
      console.log(`  ID: ${emp.id}`);
      console.log(`  이름: ${emp.name}`);
      console.log(`  사번: ${emp.employee_id}`);
    });

    const kimEmployeeId = employeeData?.[0]?.id;
    if (!kimEmployeeId) {
      console.error('❌ 김탁수 직원 ID를 찾을 수 없습니다.');
      return;
    }

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

    // 4. employee_tasks에서 휴식 관련 데이터 확인
    console.log('\n4️⃣ Employee Tasks 휴식 관련 데이터:');
    const { data: tasksData, error: tasksError } = await supabase
      .from('employee_tasks')
      .select('*')
      .eq('employee_id', kimEmployeeId)
      .eq('task_date', '2025-09-17')
      .or('title.ilike.%휴식%,employee_note.ilike.%휴식%');
    
    if (tasksError) {
      console.error('❌ Employee Tasks 데이터 조회 실패:', tasksError);
    } else {
      console.log(`📊 김탁수 9월 17일 휴식 관련 Tasks 레코드 수: ${tasksData?.length || 0}`);
      tasksData?.forEach((record, index) => {
        console.log(`\n  레코드 ${index + 1}:`);
        console.log(`    title: ${record.title}`);
        console.log(`    employee_note: ${record.employee_note}`);
        console.log(`    task_date: ${record.task_date}`);
        console.log(`    created_at: ${record.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ 전체 프로세스 오류:', error);
  }
}

debugKimAttendance();
