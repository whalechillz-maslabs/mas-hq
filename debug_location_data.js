const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLocationData() {
  console.log('🔍 위치 정보 데이터 구조 확인...\n');
  
  try {
    // 1. attendance 테이블의 location 필드 구조 확인
    console.log('1️⃣ attendance 테이블 location 필드 확인...');
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('id, employee_id, date, check_in_time, check_out_time, location')
      .eq('date', '2025-09-14');
    
    if (attendanceError) {
      console.error('❌ attendance 데이터 조회 오류:', attendanceError);
    } else if (attendanceData && attendanceData.length > 0) {
      console.log('✅ attendance 데이터:');
      attendanceData.forEach((record, index) => {
        console.log(`   ${index + 1}. 직원ID: ${record.employee_id}`);
        console.log(`      - date: ${record.date}`);
        console.log(`      - check_in_time: ${record.check_in_time}`);
        console.log(`      - check_out_time: ${record.check_out_time}`);
        console.log(`      - location: ${JSON.stringify(record.location, null, 2)}`);
        console.log('');
      });
    } else {
      console.log('❌ attendance 데이터가 없습니다.');
    }
    
    // 2. schedules 테이블의 위치 정보 확인
    console.log('\n2️⃣ schedules 테이블 위치 정보 확인...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedules')
      .select('id, employee_id, schedule_date, actual_start, actual_end, check_in_location, check_out_location')
      .eq('schedule_date', '2025-09-14');
    
    if (scheduleError) {
      console.error('❌ schedules 데이터 조회 오류:', scheduleError);
    } else if (scheduleData && scheduleData.length > 0) {
      console.log('✅ schedules 데이터:');
      scheduleData.forEach((record, index) => {
        console.log(`   ${index + 1}. 직원ID: ${record.employee_id}`);
        console.log(`      - schedule_date: ${record.schedule_date}`);
        console.log(`      - actual_start: ${record.actual_start}`);
        console.log(`      - actual_end: ${record.actual_end}`);
        console.log(`      - check_in_location: ${JSON.stringify(record.check_in_location, null, 2)}`);
        console.log(`      - check_out_location: ${JSON.stringify(record.check_out_location, null, 2)}`);
        console.log('');
      });
    } else {
      console.log('❌ schedules 데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

debugLocationData();
