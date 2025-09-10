const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkHeoId() {
  try {
    console.log('🔍 허상원 ID 확인 중...');
    
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '허상원');

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ 허상원 정보:');
      console.log('- ID:', data[0].id);
      console.log('- 이름:', data[0].name);
      console.log('- 직원번호:', data[0].employee_id);
    } else {
      console.log('❌ 허상원을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

checkHeoId();