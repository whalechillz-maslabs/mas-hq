const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceLocation() {
  console.log('🔍 오늘 출근 데이터 위치 정보 확인...\n');
  
  try {
    // 1. attendance 테이블 구조 확인
    console.log('1️⃣ attendance 테이블 구조 확인...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ 테이블 구조 확인 오류:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('✅ attendance 테이블 컬럼들:');
      Object.keys(tableInfo[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof tableInfo[0][key]}`);
      });
    }
    
    // 2. 오늘 김탁수의 출근 데이터 상세 확인
    console.log('\n2️⃣ 오늘 김탁수 출근 데이터 상세 확인...');
    const { data: todayAttendance, error: todayError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', '2025-09-14')
      .eq('employee_id', '74d076b8-ffad-4103-8346-127aff1f1305');
    
    if (todayError) {
      console.error('❌ 오늘 출근 데이터 조회 오류:', todayError);
    } else if (todayAttendance && todayAttendance.length > 0) {
      console.log('✅ 김탁수 오늘 출근 데이터:');
      const record = todayAttendance[0];
      Object.keys(record).forEach(key => {
        const value = record[key];
        if (value === null) {
          console.log(`   - ${key}: null`);
        } else if (typeof value === 'object') {
          console.log(`   - ${key}: ${JSON.stringify(value)}`);
        } else {
          console.log(`   - ${key}: ${value}`);
        }
      });
    } else {
      console.log('❌ 김탁수 오늘 출근 데이터가 없습니다.');
    }
    
    // 3. 최근 출근 기록들의 위치 정보 확인
    console.log('\n3️⃣ 최근 출근 기록들의 위치 정보 확인...');
    const { data: recentAttendance, error: recentError } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ 최근 출근 데이터 조회 오류:', recentError);
    } else if (recentAttendance && recentAttendance.length > 0) {
      console.log('✅ 최근 출근 기록들:');
      recentAttendance.forEach((record, index) => {
        console.log(`   ${index + 1}. 날짜: ${record.date}, 직원ID: ${record.employee_id}`);
        console.log(`      - check_in_time: ${record.check_in_time}`);
        console.log(`      - check_out_time: ${record.check_out_time}`);
        console.log(`      - location: ${record.location || 'null'}`);
        console.log(`      - check_in_location: ${record.check_in_location || 'null'}`);
        console.log(`      - check_out_location: ${record.check_out_location || 'null'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkAttendanceLocation();
