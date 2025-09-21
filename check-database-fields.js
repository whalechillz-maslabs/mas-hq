const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabaseFields() {
  try {
    console.log('🔍 데이터베이스 필드 확인 중...');
    
    // 1. employee_tasks 테이블의 스키마 확인
    console.log('\n1. employee_tasks 테이블 스키마 확인:');
    const { data: schemaData, error: schemaError } = await supabase
      .from('employee_tasks')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('스키마 확인 오류:', schemaError);
    } else {
      console.log('✅ employee_tasks 테이블 접근 가능');
      if (schemaData && schemaData.length > 0) {
        console.log('📋 사용 가능한 필드들:');
        Object.keys(schemaData[0]).forEach(field => {
          console.log(`  - ${field}: ${typeof schemaData[0][field]}`);
        });
      }
    }
    
    // 2. OP5 업무 중 방문 예약 관련 필드가 있는 데이터 확인
    console.log('\n2. OP5 업무 중 방문 예약 관련 필드 확인:');
    const { data: op5Tasks, error: op5Error } = await supabase
      .from('employee_tasks')
      .select(`
        id,
        title,
        customer_name,
        sita_booking,
        visit_booking_date,
        visit_booking_time,
        operation_type:operation_types(code, name)
      `)
      .eq('operation_type.operation_types.code', 'OP5')
      .limit(5);
    
    if (op5Error) {
      console.error('OP5 업무 조회 오류:', op5Error);
    } else {
      console.log(`✅ OP5 업무 ${op5Tasks?.length || 0}건 조회됨`);
      op5Tasks?.forEach((task, index) => {
        console.log(`\n  ${index + 1}. ${task.title} (${task.customer_name})`);
        console.log(`     - sita_booking: ${task.sita_booking}`);
        console.log(`     - visit_booking_date: ${task.visit_booking_date}`);
        console.log(`     - visit_booking_time: ${task.visit_booking_time}`);
      });
    }
    
    // 3. 긴급 업무 중 OP5 업무 확인
    console.log('\n3. 긴급 업무 중 OP5 업무 확인:');
    const { data: urgentTasks, error: urgentError } = await supabase
      .from('employee_tasks')
      .select(`
        id,
        title,
        customer_name,
        task_priority,
        sita_booking,
        visit_booking_date,
        visit_booking_time,
        operation_type:operation_types(code, name)
      `)
      .eq('task_priority', 'urgent')
      .eq('operation_type.operation_types.code', 'OP5');
    
    if (urgentError) {
      console.error('긴급 OP5 업무 조회 오류:', urgentError);
    } else {
      console.log(`✅ 긴급 OP5 업무 ${urgentTasks?.length || 0}건 조회됨`);
      urgentTasks?.forEach((task, index) => {
        console.log(`\n  ${index + 1}. ${task.title} (${task.customer_name})`);
        console.log(`     - sita_booking: ${task.sita_booking}`);
        console.log(`     - visit_booking_date: ${task.visit_booking_date}`);
        console.log(`     - visit_booking_time: ${task.visit_booking_time}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 확인 중 오류 발생:', error);
  }
}

// 실행
checkDatabaseFields();
