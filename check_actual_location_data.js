const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualLocationData() {
  console.log('🔍 실제 위치 데이터 확인...\n');
  
  try {
    // 1. attendance 테이블의 실제 데이터 확인
    console.log('1️⃣ attendance 테이블 전체 데이터 확인...');
    const { data: allAttendanceData, error: allError } = await supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allError) {
      console.error('❌ attendance 전체 데이터 조회 오류:', allError);
    } else if (allAttendanceData && allAttendanceData.length > 0) {
      console.log('✅ attendance 최근 5개 데이터:');
      allAttendanceData.forEach((record, index) => {
        console.log(`   ${index + 1}. 직원ID: ${record.employee_id}`);
        console.log(`      - date: ${record.date}`);
        console.log(`      - check_in_time: ${record.check_in_time}`);
        console.log(`      - check_out_time: ${record.check_out_time}`);
        console.log(`      - location: ${JSON.stringify(record.location, null, 2)}`);
        console.log(`      - status: ${record.status}`);
        console.log(`      - created_at: ${record.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ attendance 데이터가 없습니다.');
    }
    
    // 2. 오늘 날짜의 attendance 데이터 상세 확인
    console.log('\n2️⃣ 오늘 날짜 attendance 데이터 상세 확인...');
    const { data: todayData, error: todayError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', '2025-09-14');
    
    if (todayError) {
      console.error('❌ 오늘 attendance 데이터 조회 오류:', todayError);
    } else if (todayData && todayData.length > 0) {
      console.log('✅ 오늘 attendance 데이터 상세:');
      todayData.forEach((record, index) => {
        console.log(`   ${index + 1}. 직원ID: ${record.employee_id}`);
        console.log(`      - date: ${record.date}`);
        console.log(`      - check_in_time: ${record.check_in_time}`);
        console.log(`      - check_out_time: ${record.check_out_time}`);
        console.log(`      - location: ${JSON.stringify(record.location, null, 2)}`);
        console.log(`      - location type: ${typeof record.location}`);
        console.log(`      - location keys: ${record.location ? Object.keys(record.location) : 'null'}`);
        console.log(`      - status: ${record.status}`);
        console.log(`      - total_hours: ${record.total_hours}`);
        console.log(`      - created_at: ${record.created_at}`);
        console.log(`      - updated_at: ${record.updated_at}`);
        console.log('');
      });
    } else {
      console.log('❌ 오늘 attendance 데이터가 없습니다.');
    }
    
    // 3. schedules 테이블도 확인
    console.log('\n3️⃣ schedules 테이블 확인...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('schedule_date', '2025-09-14');
    
    if (scheduleError) {
      console.error('❌ schedules 데이터 조회 오류:', scheduleError);
    } else if (scheduleData && scheduleData.length > 0) {
      console.log('✅ 오늘 schedules 데이터:');
      scheduleData.forEach((record, index) => {
        console.log(`   ${index + 1}. 직원ID: ${record.employee_id}`);
        console.log(`      - schedule_date: ${record.schedule_date}`);
        console.log(`      - actual_start: ${record.actual_start}`);
        console.log(`      - actual_end: ${record.actual_end}`);
        console.log(`      - check_in_location: ${JSON.stringify(record.check_in_location, null, 2)}`);
        console.log(`      - check_out_location: ${JSON.stringify(record.check_out_location, null, 2)}`);
        console.log(`      - status: ${record.status}`);
        console.log('');
      });
    } else {
      console.log('❌ 오늘 schedules 데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkActualLocationData();
