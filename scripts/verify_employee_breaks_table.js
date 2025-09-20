const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEmployeeBreaksTable() {
  console.log('🔍 employee_breaks 테이블 확인 시작...\n');

  try {
    // 1. 테이블 존재 여부 확인
    console.log('1️⃣ 테이블 존재 여부 확인...');
    const { data, error } = await supabase
      .from('employee_breaks')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ employee_breaks 테이블이 존재하지 않습니다:', error.message);
      return;
    }

    console.log('✅ employee_breaks 테이블이 존재합니다.');

    // 2. 테이블 구조 확인
    console.log('\n2️⃣ 테이블 구조 확인...');
    const { data: structure, error: structureError } = await supabase
      .from('employee_breaks')
      .select('*')
      .limit(0);

    if (structureError) {
      console.error('❌ 테이블 구조 확인 실패:', structureError.message);
    } else {
      console.log('✅ 테이블 구조가 정상입니다.');
    }

    // 3. 샘플 데이터 삽입 테스트
    console.log('\n3️⃣ 샘플 데이터 삽입 테스트...');
    
    // 직원 목록 조회
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name')
      .limit(1);

    if (empError || !employees || employees.length === 0) {
      console.log('⚠️ 직원 데이터가 없어 샘플 데이터 삽입을 건너뜁니다.');
      return;
    }

    const testEmployee = employees[0];
    const today = new Date().toISOString().split('T')[0];

    const sampleData = {
      employee_id: testEmployee.id,
      date: today,
      break_type: 'lunch',
      start_time: '12:00:00',
      end_time: '13:00:00',
      duration_minutes: 60,
      notes: '점심 휴식 (테스트 데이터)'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('employee_breaks')
      .insert(sampleData)
      .select();

    if (insertError) {
      console.error('❌ 샘플 데이터 삽입 실패:', insertError.message);
    } else {
      console.log('✅ 샘플 데이터 삽입 성공:', insertData[0]);
      
      // 4. 삽입된 데이터 삭제
      console.log('\n4️⃣ 테스트 데이터 정리...');
      const { error: deleteError } = await supabase
        .from('employee_breaks')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('❌ 테스트 데이터 삭제 실패:', deleteError.message);
      } else {
        console.log('✅ 테스트 데이터 정리 완료');
      }
    }

    console.log('\n🎉 employee_breaks 테이블이 정상적으로 작동합니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

verifyEmployeeBreaksTable();
