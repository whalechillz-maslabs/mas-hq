const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTodaySitaData() {
  try {
    console.log('🔍 오늘의 시타 예약 데이터 확인 중...');
    
    // 오늘 날짜 계산 (한국 시간)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const today = koreaTime.toISOString().split('T')[0];
    const todayFormatted = today.replace(/-/g, '.');
    
    console.log('📅 오늘 날짜:', today);
    console.log('📅 포맷된 날짜:', todayFormatted);
    
    // 1. 모든 OP5 업무 조회
    console.log('\n1. 모든 OP5 업무 조회:');
    const { data: allOp5Tasks, error: op5Error } = await supabase
      .from('employee_tasks')
      .select(`
        id,
        title,
        customer_name,
        sita_booking,
        visit_booking_date,
        visit_booking_time,
        task_date,
        created_at,
        operation_type:operation_types(code, name),
        employee:employees(name)
      `)
      .eq('operation_type.operation_types.code', 'OP5')
      .order('created_at', { ascending: false });
    
    if (op5Error) {
      console.error('OP5 업무 조회 오류:', op5Error);
    } else {
      console.log(`✅ OP5 업무 ${allOp5Tasks?.length || 0}건 조회됨`);
      allOp5Tasks?.forEach((task, index) => {
        console.log(`\n  ${index + 1}. ${task.title} (${task.customer_name})`);
        console.log(`     - sita_booking: ${task.sita_booking}`);
        console.log(`     - visit_booking_date: ${task.visit_booking_date}`);
        console.log(`     - visit_booking_time: ${task.visit_booking_time}`);
        console.log(`     - task_date: ${task.task_date}`);
        console.log(`     - 작성자: ${task.employee?.name}`);
      });
    }
    
    // 2. 오늘 날짜의 시타 예약 조회
    console.log('\n2. 오늘 날짜의 시타 예약 조회:');
    const { data: todaySitaTasks, error: todayError } = await supabase
      .from('employee_tasks')
      .select(`
        id,
        title,
        customer_name,
        sita_booking,
        visit_booking_date,
        visit_booking_time,
        task_date,
        created_at,
        operation_type:operation_types(code, name),
        employee:employees(name)
      `)
      .eq('operation_type.operation_types.code', 'OP5')
      .eq('visit_booking_date', todayFormatted);
    
    if (todayError) {
      console.error('오늘 시타 예약 조회 오류:', todayError);
    } else {
      console.log(`✅ 오늘 시타 예약 ${todaySitaTasks?.length || 0}건 조회됨`);
      todaySitaTasks?.forEach((task, index) => {
        console.log(`\n  ${index + 1}. ${task.title} (${task.customer_name})`);
        console.log(`     - sita_booking: ${task.sita_booking}`);
        console.log(`     - visit_booking_date: ${task.visit_booking_date}`);
        console.log(`     - visit_booking_time: ${task.visit_booking_time}`);
        console.log(`     - 작성자: ${task.employee?.name}`);
      });
    }
    
    // 3. sita_booking이 true인 업무 조회
    console.log('\n3. sita_booking이 true인 업무 조회:');
    const { data: sitaBookingTasks, error: sitaError } = await supabase
      .from('employee_tasks')
      .select(`
        id,
        title,
        customer_name,
        sita_booking,
        visit_booking_date,
        visit_booking_time,
        task_date,
        created_at,
        operation_type:operation_types(code, name),
        employee:employees(name)
      `)
      .eq('operation_type.operation_types.code', 'OP5')
      .eq('sita_booking', true);
    
    if (sitaError) {
      console.error('sita_booking 업무 조회 오류:', sitaError);
    } else {
      console.log(`✅ sita_booking 업무 ${sitaBookingTasks?.length || 0}건 조회됨`);
      sitaBookingTasks?.forEach((task, index) => {
        console.log(`\n  ${index + 1}. ${task.title} (${task.customer_name})`);
        console.log(`     - sita_booking: ${task.sita_booking}`);
        console.log(`     - visit_booking_date: ${task.visit_booking_date}`);
        console.log(`     - visit_booking_time: ${task.visit_booking_time}`);
        console.log(`     - 작성자: ${task.employee?.name}`);
      });
    }
    
    // 4. visit_booking_date가 있는 모든 업무 조회
    console.log('\n4. visit_booking_date가 있는 모든 업무 조회:');
    const { data: visitBookingTasks, error: visitError } = await supabase
      .from('employee_tasks')
      .select(`
        id,
        title,
        customer_name,
        sita_booking,
        visit_booking_date,
        visit_booking_time,
        task_date,
        created_at,
        operation_type:operation_types(code, name),
        employee:employees(name)
      `)
      .eq('operation_type.operation_types.code', 'OP5')
      .not('visit_booking_date', 'is', null);
    
    if (visitError) {
      console.error('visit_booking_date 업무 조회 오류:', visitError);
    } else {
      console.log(`✅ visit_booking_date 업무 ${visitBookingTasks?.length || 0}건 조회됨`);
      visitBookingTasks?.forEach((task, index) => {
        console.log(`\n  ${index + 1}. ${task.title} (${task.customer_name})`);
        console.log(`     - sita_booking: ${task.sita_booking}`);
        console.log(`     - visit_booking_date: ${task.visit_booking_date}`);
        console.log(`     - visit_booking_time: ${task.visit_booking_time}`);
        console.log(`     - 작성자: ${task.employee?.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 확인 중 오류 발생:', error);
  }
}

// 실행
checkTodaySitaData();
