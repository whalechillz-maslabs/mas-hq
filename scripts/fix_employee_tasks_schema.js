const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function fixEmployeeTasksSchema() {
  console.log('🔧 employee_tasks 테이블 스키마 수정 시작...');
  
  try {
    // 1. achievement_status 컬럼 추가
    console.log('\n1. achievement_status 컬럼 추가 중...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE employee_tasks 
        ADD COLUMN IF NOT EXISTS achievement_status VARCHAR(20) DEFAULT 'pending';
      `
    });
    
    if (addColumnError) {
      console.log('❌ 컬럼 추가 실패:', addColumnError.message);
      // exec_sql 함수가 없을 수 있으므로 직접 SQL 실행
      console.log('📝 직접 SQL 실행을 시도합니다...');
      
      // Supabase SQL Editor에서 실행할 SQL 제공
      console.log('\n=== Supabase SQL Editor에서 실행할 SQL ===');
      console.log(`
ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS achievement_status VARCHAR(20) DEFAULT 'pending';

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_employee_tasks_achievement_status 
ON employee_tasks(achievement_status);

-- 기존 데이터가 있다면 기본값 설정
UPDATE employee_tasks 
SET achievement_status = 'pending' 
WHERE achievement_status IS NULL;
      `);
      
    } else {
      console.log('✅ achievement_status 컬럼 추가 완료');
    }
    
    // 2. 테이블 구조 확인
    console.log('\n2. 수정된 테이블 구조 확인 중...');
    const { data, error: checkError } = await supabase
      .from('employee_tasks')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.log('❌ 테이블 확인 실패:', checkError.message);
    } else {
      console.log('✅ 테이블 확인 완료');
      if (data && data.length > 0) {
        console.log('📋 현재 컬럼들:', Object.keys(data[0]));
      } else {
        console.log('📋 테이블이 비어있음');
      }
    }
    
    // 3. 테스트 데이터 삽입
    console.log('\n3. 테스트 데이터 삽입 중...');
    const { data: testData, error: insertError } = await supabase
      .from('employee_tasks')
      .insert({
        employee_id: '00000000-0000-0000-0000-000000000000', // 임시 UUID
        operation_type_id: '00000000-0000-0000-0000-000000000000', // 임시 UUID
        title: '테스트 업무',
        notes: '스키마 테스트용',
        achievement_status: 'pending',
        task_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ 테스트 데이터 삽입 실패:', insertError.message);
    } else {
      console.log('✅ 테스트 데이터 삽입 성공:', testData);
      
      // 테스트 데이터 삭제
      await supabase
        .from('employee_tasks')
        .delete()
        .eq('id', testData.id);
      console.log('🗑️ 테스트 데이터 삭제 완료');
    }
    
  } catch (error) {
    console.error('❌ 스키마 수정 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  fixEmployeeTasksSchema().catch(console.error);
}

module.exports = { fixEmployeeTasksSchema };
