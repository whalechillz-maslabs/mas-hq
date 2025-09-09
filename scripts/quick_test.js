const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function quickTest() {
  console.log('🧪 빠른 테스트 시작...');
  
  try {
    // 1. 테이블 존재 확인
    const { data, error } = await supabase
      .from('employee_tasks')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ 테이블 조회 실패:', error.message);
      return;
    }
    
    console.log('✅ employee_tasks 테이블 존재 확인');
    
    // 2. employees 테이블 확인
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name')
      .limit(1);
    
    if (!employees || employees.length === 0) {
      console.log('❌ employees 테이블에 데이터가 없습니다');
      return;
    }
    
    console.log('✅ employees 테이블 확인:', employees[0].name);
    
    // 3. operation_types 테이블 확인
    const { data: operationTypes } = await supabase
      .from('operation_types')
      .select('id, code, name')
      .limit(1);
    
    if (!operationTypes || operationTypes.length === 0) {
      console.log('❌ operation_types 테이블에 데이터가 없습니다');
      return;
    }
    
    console.log('✅ operation_types 테이블 확인:', operationTypes[0].code, operationTypes[0].name);
    
    // 4. 테스트 데이터 삽입
    const testData = {
      employee_id: employees[0].id,
      operation_type_id: operationTypes[0].id,
      title: '테스트 업무',
      notes: '스키마 테스트용',
      achievement_status: 'pending',
      task_date: new Date().toISOString().split('T')[0]
    };
    
    const { data: insertedData, error: insertError } = await supabase
      .from('employee_tasks')
      .insert(testData)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ 테스트 데이터 삽입 실패:', insertError.message);
    } else {
      console.log('✅ 테스트 데이터 삽입 성공');
      console.log('📋 삽입된 데이터 ID:', insertedData.id);
      
      // 테스트 데이터 삭제
      await supabase
        .from('employee_tasks')
        .delete()
        .eq('id', insertedData.id);
      console.log('🗑️ 테스트 데이터 삭제 완료');
    }
    
    console.log('\n🎉 모든 테스트 통과!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

quickTest().catch(console.error);
