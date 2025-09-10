const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNasujinTaskAdd() {
  try {
    console.log('=== 나수진 업무 추가 테스트 ===\n');

    // 1. 나수진 직원 정보 확인
    const { data: nasujin, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, role_id, roles(name)')
      .eq('name', '나수진')
      .single();

    if (empError || !nasujin) {
      console.error('❌ 나수진 직원 조회 실패:', empError);
      return;
    }

    console.log(`👤 나수진 정보: ${nasujin.name} (${nasujin.employee_id}) - 역할: ${nasujin.roles?.name}`);

    // 2. OP11 업무 유형 확인
    const { data: op11, error: op11Error } = await supabase
      .from('operation_types')
      .select('*')
      .eq('code', 'OP11')
      .single();

    if (op11Error || !op11) {
      console.error('❌ OP11 업무 유형 조회 실패:', op11Error);
      return;
    }

    console.log(`📋 OP11 정보: ${op11.name} (${op11.points}점) - target_roles: ${JSON.stringify(op11.target_roles)}`);

    // 3. 나수진이 OP11 업무를 추가할 수 있는지 권한 체크
    const userRole = nasujin.roles?.name;
    const allowedRoles = op11.target_roles || [];
    
    console.log(`🔐 권한 체크: 사용자 역할(${userRole}) vs 허용 역할(${JSON.stringify(allowedRoles)})`);
    
    if (allowedRoles.includes(userRole)) {
      console.log('✅ 나수진은 OP11 업무를 추가할 수 있습니다.');
    } else {
      console.log('❌ 나수진은 OP11 업무를 추가할 권한이 없습니다.');
    }

    // 4. 실제 업무 추가 테스트
    console.log('\n🧪 실제 업무 추가 테스트:');
    const testTask = {
      employee_id: nasujin.id,
      operation_type_id: op11.id,
      title: `나수진 OP11 테스트 업무 ${Date.now()}`,
      customer_name: '테스트 고객',
      sales_amount: 100000,
      notes: '나수진 OP11 업무 추가 테스트',
      task_date: new Date().toISOString().split('T')[0]
    };

    const { data: insertedTask, error: insertError } = await supabase
      .from('employee_tasks')
      .insert(testTask)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 업무 추가 실패:', insertError);
    } else {
      console.log('✅ 업무 추가 성공:', insertedTask.title);
      
      // 5. 추가된 업무 삭제 (테스트 정리)
      const { error: deleteError } = await supabase
        .from('employee_tasks')
        .delete()
        .eq('id', insertedTask.id);

      if (deleteError) {
        console.error('⚠️ 테스트 업무 삭제 실패:', deleteError);
      } else {
        console.log('🧹 테스트 업무 삭제 완료');
      }
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

testNasujinTaskAdd();
