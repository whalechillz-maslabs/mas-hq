const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceSchema() {
  console.log('🔍 attendance 테이블 구조 상세 확인...\n');
  
  try {
    // 1. attendance 테이블의 실제 데이터 샘플 확인
    console.log('1️⃣ attendance 테이블 샘플 데이터 확인...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ attendance 테이블 샘플 조회 오류:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ attendance 테이블 샘플 데이터:');
      const record = sampleData[0];
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
      console.log('❌ attendance 테이블에 데이터가 없습니다.');
    }
    
    // 2. attendance 테이블의 컬럼 목록 확인
    console.log('\n2️⃣ attendance 테이블 컬럼 목록 확인...');
    const { data: columns, error: columnsError } = await supabase
      .from('attendance')
      .select('*')
      .limit(0);
    
    if (columnsError) {
      console.error('❌ attendance 테이블 컬럼 조회 오류:', columnsError);
    } else {
      console.log('✅ attendance 테이블 컬럼 조회 성공');
    }
    
    // 3. 오늘 날짜의 attendance 데이터 확인
    console.log('\n3️⃣ 오늘 날짜 attendance 데이터 확인...');
    const { data: todayData, error: todayError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', '2025-09-14');
    
    if (todayError) {
      console.error('❌ 오늘 attendance 데이터 조회 오류:', todayError);
    } else if (todayData && todayData.length > 0) {
      console.log('✅ 오늘 attendance 데이터:');
      todayData.forEach((record, index) => {
        console.log(`   ${index + 1}. 직원ID: ${record.employee_id}`);
        console.log(`      - date: ${record.date}`);
        console.log(`      - check_in_time: ${record.check_in_time}`);
        console.log(`      - check_out_time: ${record.check_out_time}`);
        console.log(`      - location: ${record.location || 'null'}`);
        console.log(`      - check_out_location: ${record.check_out_location || 'null'}`);
        console.log('');
      });
    } else {
      console.log('❌ 오늘 attendance 데이터가 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkAttendanceSchema();
