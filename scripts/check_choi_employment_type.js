const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkChoiEmploymentType() {
  try {
    console.log('=== 최형호 고용형태 확인 ===');
    
    // 최형호 정보 조회
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.error('최형호 정보 조회 실패:', empError);
      return;
    }
    
    console.log('현재 최형호 정보:');
    console.log(`- 이름: ${choiEmployee.name}`);
    console.log(`- 직원번호: ${choiEmployee.employee_id}`);
    console.log(`- 고용형태: ${choiEmployee.employment_type}`);
    console.log(`- 월급: ${choiEmployee.monthly_salary || '없음'}`);
    console.log(`- 시급: ${choiEmployee.hourly_rate || '없음'}`);
    
    // 8월에는 시간제로 근무했으므로 고용형태를 part_time으로 변경
    if (choiEmployee.employment_type === 'full_time') {
      console.log('\n⚠️ 최형호가 full_time으로 설정되어 있습니다.');
      console.log('8월에는 시간제로 근무했으므로 part_time으로 변경해야 합니다.');
      
      const { error: updateError } = await supabase
        .from('employees')
        .update({ 
          employment_type: 'part_time',
          updated_at: new Date().toISOString()
        })
        .eq('id', choiEmployee.id);
      
      if (updateError) {
        console.error('고용형태 업데이트 실패:', updateError);
        return;
      }
      
      console.log('✅ 최형호 고용형태를 part_time으로 변경했습니다.');
    } else {
      console.log('✅ 최형호가 이미 part_time으로 설정되어 있습니다.');
    }
    
    // 업데이트된 정보 확인
    const { data: updatedEmployee, error: updatedError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();
    
    if (updatedError) {
      console.error('업데이트된 정보 조회 실패:', updatedError);
      return;
    }
    
    console.log('\n업데이트된 최형호 정보:');
    console.log(`- 고용형태: ${updatedEmployee.employment_type}`);
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkChoiEmploymentType();
