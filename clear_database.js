const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
  console.log('🗑️ 데이터베이스 데이터 삭제 시작...\n');
  
  try {
    // 1. attendance 테이블 데이터 삭제
    console.log('1️⃣ attendance 테이블 데이터 삭제...');
    const { error: attendanceError } = await supabase
      .from('attendance')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
    
    if (attendanceError) {
      console.error('❌ attendance 데이터 삭제 오류:', attendanceError);
    } else {
      console.log('✅ attendance 데이터 삭제 완료');
    }
    
    // 2. schedules 테이블 데이터 삭제
    console.log('\n2️⃣ schedules 테이블 데이터 삭제...');
    const { error: schedulesError } = await supabase
      .from('schedules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
    
    if (schedulesError) {
      console.error('❌ schedules 데이터 삭제 오류:', schedulesError);
    } else {
      console.log('✅ schedules 데이터 삭제 완료');
    }
    
    // 3. payslips 테이블 데이터 삭제
    console.log('\n3️⃣ payslips 테이블 데이터 삭제...');
    const { error: payslipsError } = await supabase
      .from('payslips')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
    
    if (payslipsError) {
      console.error('❌ payslips 데이터 삭제 오류:', payslipsError);
    } else {
      console.log('✅ payslips 데이터 삭제 완료');
    }
    
    // 4. employee_tasks 테이블 데이터 삭제
    console.log('\n4️⃣ employee_tasks 테이블 데이터 삭제...');
    const { error: tasksError } = await supabase
      .from('employee_tasks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
    
    if (tasksError) {
      console.error('❌ employee_tasks 데이터 삭제 오류:', tasksError);
    } else {
      console.log('✅ employee_tasks 데이터 삭제 완료');
    }
    
    // 5. 삭제 후 테이블 상태 확인
    console.log('\n5️⃣ 삭제 후 테이블 상태 확인...');
    
    const { data: attendanceCount } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true });
    
    const { data: schedulesCount } = await supabase
      .from('schedules')
      .select('id', { count: 'exact', head: true });
    
    const { data: payslipsCount } = await supabase
      .from('payslips')
      .select('id', { count: 'exact', head: true });
    
    const { data: tasksCount } = await supabase
      .from('employee_tasks')
      .select('id', { count: 'exact', head: true });
    
    console.log('📊 삭제 후 테이블 상태:');
    console.log(`   - attendance: ${attendanceCount?.length || 0}개`);
    console.log(`   - schedules: ${schedulesCount?.length || 0}개`);
    console.log(`   - payslips: ${payslipsCount?.length || 0}개`);
    console.log(`   - employee_tasks: ${tasksCount?.length || 0}개`);
    
    console.log('\n✅ 데이터베이스 데이터 삭제 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

clearDatabase();
