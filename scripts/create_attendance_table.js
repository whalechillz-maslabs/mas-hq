const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createAttendanceTable() {
  console.log('🔧 attendance 테이블 생성 시작...\n');

  try {
    // SQL로 attendance 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS attendance (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        check_in_time TIME,
        check_out_time TIME,
        break_start_time TIME,
        break_end_time TIME,
        total_hours DECIMAL(4,2),
        overtime_hours DECIMAL(4,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'present',
        location JSONB,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(employee_id, date)
      );
    `;

    console.log('📋 attendance 테이블 생성 SQL:');
    console.log(createTableSQL);

    // RLS (Row Level Security) 정책 추가
    const rlsPolicySQL = `
      -- RLS 활성화
      ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
      
      -- 모든 사용자가 읽기 가능
      CREATE POLICY "attendance_select_policy" ON attendance
        FOR SELECT USING (true);
      
      -- 인증된 사용자가 삽입 가능
      CREATE POLICY "attendance_insert_policy" ON attendance
        FOR INSERT WITH CHECK (true);
      
      -- 인증된 사용자가 업데이트 가능
      CREATE POLICY "attendance_update_policy" ON attendance
        FOR UPDATE USING (true);
    `;

    console.log('\n📋 RLS 정책 SQL:');
    console.log(rlsPolicySQL);

    // 인덱스 생성
    const indexSQL = `
      -- 성능을 위한 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
    `;

    console.log('\n📋 인덱스 생성 SQL:');
    console.log(indexSQL);

    console.log('\n✅ attendance 테이블 생성 스크립트 준비 완료!');
    console.log('📝 위의 SQL을 Supabase 대시보드에서 실행하거나,');
    console.log('📝 Supabase CLI를 사용하여 실행하세요.');

    // 테이블 존재 여부 확인
    console.log('\n🔍 기존 테이블 확인 중...');
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .limit(1);

      if (error) {
        console.log('❌ attendance 테이블이 존재하지 않습니다.');
        console.log('   오류:', error.message);
      } else {
        console.log('✅ attendance 테이블이 이미 존재합니다.');
        console.log(`   📊 현재 레코드 수: ${data.length}개`);
      }
    } catch (checkError) {
      console.log('❌ attendance 테이블 확인 실패:', checkError.message);
    }

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
createAttendanceTable();
