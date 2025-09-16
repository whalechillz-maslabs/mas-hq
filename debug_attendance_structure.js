const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAttendanceStructure() {
  console.log('🔍 Attendance 테이블 구조 및 데이터 분석 시작...\n');

  try {
    // 1. 테이블 구조 확인
    console.log('1️⃣ 테이블 구조 확인:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'attendance')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ 테이블 구조 조회 실패:', tableError);
    } else {
      console.log('📋 Attendance 테이블 컬럼:');
      tableInfo?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 2. 9월 16일 데이터 확인
    console.log('\n2️⃣ 9월 16일 Attendance 데이터:');
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', '2025-09-16');
    
    if (attendanceError) {
      console.error('❌ Attendance 데이터 조회 실패:', attendanceError);
    } else {
      console.log(`📊 9월 16일 Attendance 레코드 수: ${attendanceData?.length || 0}`);
      attendanceData?.forEach((record, index) => {
        console.log(`\n  레코드 ${index + 1}:`);
        console.log(`    employee_id: ${record.employee_id}`);
        console.log(`    date: ${record.date}`);
        console.log(`    check_in_time: ${record.check_in_time}`);
        console.log(`    check_out_time: ${record.check_out_time}`);
        console.log(`    total_hours: ${record.total_hours}`);
        console.log(`    status: ${record.status}`);
        console.log(`    created_at: ${record.created_at}`);
        console.log(`    updated_at: ${record.updated_at}`);
      });
    }

    // 3. 허상원의 직원 ID 확인
    console.log('\n3️⃣ 허상원 직원 정보:');
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '허상원');
    
    if (employeeError) {
      console.error('❌ 직원 정보 조회 실패:', employeeError);
    } else {
      console.log('👤 허상원 정보:');
      employeeData?.forEach(emp => {
        console.log(`  ID: ${emp.id}`);
        console.log(`  이름: ${emp.name}`);
        console.log(`  사번: ${emp.employee_id}`);
      });
    }

    // 4. 테스트 upsert 시도
    if (employeeData && employeeData.length > 0) {
      console.log('\n4️⃣ 테스트 upsert 시도:');
      const testEmployeeId = employeeData[0].id;
      
      const { data: testData, error: testError } = await supabase
        .from('attendance')
        .upsert({
          employee_id: testEmployeeId,
          date: '2025-09-16',
          check_in_time: '09:00:00',
          check_out_time: '18:00:00',
          total_hours: 8,
          overtime_hours: 0,
          status: 'completed',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'employee_id,date'
        })
        .select();
      
      if (testError) {
        console.error('❌ 테스트 upsert 실패:', testError);
        console.error('오류 상세:', JSON.stringify(testError, null, 2));
      } else {
        console.log('✅ 테스트 upsert 성공:', testData);
      }
    }

  } catch (error) {
    console.error('❌ 전체 프로세스 오류:', error);
  }
}

debugAttendanceStructure();
