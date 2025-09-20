const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEmployeeBreaksTable() {
  console.log('🔧 employee_breaks 테이블 수정 시작...\n');

  try {
    // 1. 현재 테이블 구조 확인
    console.log('1️⃣ 현재 테이블 구조 확인...');
    const { data, error } = await supabase
      .from('employee_breaks')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 테이블 조회 실패:', error.message);
      return;
    }

    console.log('✅ 테이블 조회 성공');

    // 2. 샘플 데이터 삽입 테스트 (ID 자동 생성)
    console.log('\n2️⃣ 샘플 데이터 삽입 테스트...');
    
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

    // ID를 제외하고 데이터 삽입 (자동 생성)
    const sampleData = {
      employee_id: testEmployee.id,
      date: today,
      break_type: 'lunch',
      start_time: '12:00:00',
      end_time: '13:00:00',
      duration_minutes: 60,
      notes: '점심 휴식 (테스트 데이터)'
    };

    console.log('📝 삽입할 데이터:', sampleData);

    const { data: insertData, error: insertError } = await supabase
      .from('employee_breaks')
      .insert(sampleData)
      .select();

    if (insertError) {
      console.error('❌ 샘플 데이터 삽입 실패:', insertError.message);
      
      // 3. 테이블 재생성 SQL 제공
      console.log('\n3️⃣ 테이블 재생성 SQL:');
      console.log('Supabase Dashboard → SQL Editor에서 다음 SQL을 실행하세요:');
      console.log('\n' + '='.repeat(80));
      console.log(`
-- 기존 테이블 삭제 (주의: 데이터 손실)
DROP TABLE IF EXISTS employee_breaks;

-- 새 테이블 생성
CREATE TABLE employee_breaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  break_type VARCHAR(20) NOT NULL DEFAULT 'lunch',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date, break_type, start_time)
);

-- RLS 정책
ALTER TABLE employee_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_breaks_select_policy" ON employee_breaks
  FOR SELECT USING (true);

CREATE POLICY "employee_breaks_insert_policy" ON employee_breaks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "employee_breaks_update_policy" ON employee_breaks
  FOR UPDATE USING (true);

CREATE POLICY "employee_breaks_delete_policy" ON employee_breaks
  FOR DELETE USING (true);

-- 인덱스
CREATE INDEX idx_employee_breaks_employee_date ON employee_breaks(employee_id, date);
CREATE INDEX idx_employee_breaks_date ON employee_breaks(date);
CREATE INDEX idx_employee_breaks_type ON employee_breaks(break_type);
      `);
      console.log('='.repeat(80));
      
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
        console.log('\n🎉 employee_breaks 테이블이 정상적으로 작동합니다!');
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixEmployeeBreaksTable();
