const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createAttendanceTableDirect() {
  console.log('🔧 attendance 테이블 직접 생성 시작...\n');

  try {
    // 1. 먼저 테이블 존재 여부 확인
    console.log('1️⃣ 기존 테이블 확인...');
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .limit(1);

      if (error && error.message.includes('Could not find the table')) {
        console.log('❌ attendance 테이블이 존재하지 않습니다.');
      } else {
        console.log('✅ attendance 테이블이 이미 존재합니다.');
        return;
      }
    } catch (err) {
      console.log('❌ attendance 테이블 확인 실패:', err.message);
    }

    // 2. SQL을 직접 실행하여 테이블 생성 시도
    console.log('\n2️⃣ SQL 실행으로 테이블 생성 시도...');
    
    // Supabase의 rpc 함수를 사용하여 SQL 실행
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

    try {
      // SQL 실행을 위한 rpc 함수 호출 (만약 존재한다면)
      const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        console.log('❌ RPC 함수로 SQL 실행 실패:', error.message);
        console.log('   → 다른 방법을 시도합니다.');
      } else {
        console.log('✅ RPC 함수로 테이블 생성 성공!');
      }
    } catch (rpcError) {
      console.log('❌ RPC 함수 호출 실패:', rpcError.message);
      console.log('   → 직접 삽입 방식으로 시도합니다.');
    }

    // 3. 직접 삽입 방식으로 테이블 생성 시도
    console.log('\n3️⃣ 직접 삽입 방식으로 테이블 생성 시도...');
    
    // 샘플 데이터로 테이블 구조 확인
    const sampleAttendanceData = {
      employee_id: '00000000-0000-0000-0000-000000000000', // 더미 ID
      date: '2025-01-01',
      check_in_time: '09:00:00',
      check_out_time: '18:00:00',
      break_start_time: '12:00:00',
      break_end_time: '13:00:00',
      total_hours: 8.0,
      overtime_hours: 0,
      status: 'present',
      location: { latitude: 37.5665, longitude: 126.9780, address: '서울시 중구' },
      notes: '테스트 데이터'
    };

    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([sampleAttendanceData])
        .select();

      if (error) {
        console.log('❌ 직접 삽입 실패:', error.message);
        console.log('   → 테이블이 아직 생성되지 않았습니다.');
      } else {
        console.log('✅ 직접 삽입 성공! 테이블이 생성되었습니다.');
        
        // 테스트 데이터 삭제
        await supabase
          .from('attendance')
          .delete()
          .eq('employee_id', '00000000-0000-0000-0000-000000000000');
        console.log('   → 테스트 데이터 삭제 완료');
      }
    } catch (insertError) {
      console.log('❌ 직접 삽입 중 오류:', insertError.message);
    }

    // 4. 최종 확인
    console.log('\n4️⃣ 최종 테이블 확인...');
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .limit(1);

      if (error) {
        console.log('❌ 최종 확인 실패:', error.message);
        console.log('\n📋 수동 생성이 필요합니다:');
        console.log('Supabase 대시보드 → SQL Editor에서 다음 쿼리 실행:');
        console.log(createTableSQL);
      } else {
        console.log('✅ attendance 테이블 생성 완료!');
        console.log(`   📊 현재 레코드 수: ${data.length}개`);
      }
    } catch (finalError) {
      console.log('❌ 최종 확인 중 오류:', finalError.message);
    }

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error);
  }
}

// 스크립트 실행
createAttendanceTableDirect();
