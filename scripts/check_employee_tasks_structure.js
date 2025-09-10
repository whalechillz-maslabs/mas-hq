const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmployeeTasksStructure() {
  try {
    console.log('=== employee_tasks 테이블 구조 확인 ===\n');

    // 나수진의 업무 기록 조회 (status 컬럼 제외)
    const { data: tasks, error: taskError } = await supabase
      .from('employee_tasks')
      .select(`
        id,
        title,
        task_date,
        operation_type_id,
        operation_types(code, name),
        created_at
      `)
      .eq('employee_id', 'f34ed8e1-cd7e-44ad-892c-50ee5bca6ad3')
      .order('task_date', { ascending: false })
      .limit(5);

    if (taskError) {
      console.error('❌ 업무 기록 조회 실패:', taskError);
      return;
    }

    if (tasks && tasks.length > 0) {
      console.log('📊 나수진의 최근 업무 기록:');
      tasks.forEach(task => {
        console.log(`• ${task.task_date}: ${task.operation_types?.code || 'N/A'} - ${task.title}`);
      });
    } else {
      console.log('• 나수진의 업무 기록이 없습니다.');
    }

    // 전체 업무 기록 개수 확인
    const { count, error: countError } = await supabase
      .from('employee_tasks')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 업무 기록 개수 조회 실패:', countError);
    } else {
      console.log(`\n📈 전체 업무 기록 개수: ${count}건`);
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkEmployeeTasksStructure();
