const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOp11Op12TargetRoles() {
  try {
    console.log('=== OP11, OP12 target_roles 수정 ===\n');

    // OP11, OP12의 target_roles를 다른 OP들과 동일하게 설정
    const targetRoles = ['admin', 'manager', 'team_lead', 'employee', 'part_time'];

    // OP11 수정
    console.log('🔧 OP11 target_roles 수정 중...');
    const { error: op11Error } = await supabase
      .from('operation_types')
      .update({ target_roles: targetRoles })
      .eq('code', 'OP11');

    if (op11Error) {
      console.error('❌ OP11 수정 실패:', op11Error);
    } else {
      console.log('✅ OP11 target_roles 수정 완료');
    }

    // OP12 수정
    console.log('🔧 OP12 target_roles 수정 중...');
    const { error: op12Error } = await supabase
      .from('operation_types')
      .update({ target_roles: targetRoles })
      .eq('code', 'OP12');

    if (op12Error) {
      console.error('❌ OP12 수정 실패:', op12Error);
    } else {
      console.log('✅ OP12 target_roles 수정 완료');
    }

    // 수정 결과 확인
    console.log('\n📋 수정 후 OP11, OP12 상태:');
    const { data: opTypes, error: checkError } = await supabase
      .from('operation_types')
      .select('code, name, target_roles')
      .in('code', ['OP11', 'OP12']);

    if (checkError) {
      console.error('❌ 확인 실패:', checkError);
    } else {
      opTypes.forEach(op => {
        console.log(`• ${op.code}: ${op.name} - target_roles: ${JSON.stringify(op.target_roles)}`);
      });
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

fixOp11Op12TargetRoles();
