const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOperationTypesAndEmployee() {
  try {
    console.log('=== 업무 유형 및 나수진 직원 정보 확인 ===\n');

    // 1. 모든 업무 유형 조회
    console.log('📋 모든 업무 유형:');
    const { data: operationTypes, error: opError } = await supabase
      .from('operation_types')
      .select('*')
      .order('code');

    if (opError) {
      console.error('❌ 업무 유형 조회 실패:', opError);
      return;
    }

    operationTypes.forEach(op => {
      console.log(`• ${op.code}: ${op.name} (${op.points}점) - target_roles: ${JSON.stringify(op.target_roles)}`);
    });

    console.log(`\n총 ${operationTypes.length}개 업무 유형\n`);

    // 2. 나수진 직원 정보 조회
    console.log('👤 나수진 직원 정보:');
    const { data: nasujin, error: empError } = await supabase
      .from('employees')
      .select(`
        id,
        name,
        employee_id,
        role_id,
        roles(name)
      `)
      .eq('name', '나수진')
      .single();

    if (empError) {
      console.error('❌ 나수진 직원 조회 실패:', empError);
      return;
    }

    if (!nasujin) {
      console.log('❌ 나수진 직원을 찾을 수 없습니다.');
      return;
    }

    console.log(`• 이름: ${nasujin.name}`);
    console.log(`• 직원코드: ${nasujin.employee_id}`);
    console.log(`• 역할: ${nasujin.roles?.name || 'N/A'}`);
    console.log(`• ID: ${nasujin.id}\n`);

    // 3. OP11, OP12 존재 여부 확인
    const op11 = operationTypes.find(op => op.code === 'OP11');
    const op12 = operationTypes.find(op => op.code === 'OP12');

    console.log('🔍 OP11, OP12 상태:');
    console.log(`• OP11 (전화 판매(싱싱)): ${op11 ? '✅ 존재' : '❌ 없음'}`);
    console.log(`• OP12 (CS 응대(싱싱)): ${op12 ? '✅ 존재' : '❌ 없음'}\n`);

    // 4. 나수진의 최근 업무 기록 확인
    console.log('📊 나수진의 최근 업무 기록:');
    const { data: tasks, error: taskError } = await supabase
      .from('employee_tasks')
      .select(`
        id,
        title,
        task_date,
        status,
        operation_type_id,
        operation_types(code, name)
      `)
      .eq('employee_id', nasujin.id)
      .order('task_date', { ascending: false })
      .limit(5);

    if (taskError) {
      console.error('❌ 업무 기록 조회 실패:', taskError);
    } else if (tasks && tasks.length > 0) {
      tasks.forEach(task => {
        console.log(`• ${task.task_date}: ${task.operation_types?.code || 'N/A'} - ${task.title} (${task.status})`);
      });
    } else {
      console.log('• 업무 기록이 없습니다.');
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkOperationTypesAndEmployee();
