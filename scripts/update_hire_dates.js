const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function updateHireDates() {
  console.log('=== 직원 입사일 수정 ===\n');
  
  try {
    // 입사일 업데이트 데이터
    const hireDateUpdates = [
      { employee_id: 'MASLABS-001', name: '김탁수', hire_date: '2025-01-01' },
      { employee_id: 'MASLABS-002', name: '이은정', hire_date: '2025-01-01' },
      { employee_id: 'MASLABS-003', name: '허상원', hire_date: '2025-06-19' },
      { employee_id: 'MASLABS-004', name: '최형호', hire_date: '2025-08-01' },
      { employee_id: 'MASLABS-005', name: '나수진', hire_date: '2025-04-01' },
      { employee_id: 'MASLABS-006', name: '하상희', hire_date: '2025-08-07' }
    ];
    
    // 각 직원의 입사일 업데이트
    for (const update of hireDateUpdates) {
      console.log(`${update.name} (${update.employee_id}) 입사일 수정 중...`);
      
      const { error } = await supabase
        .from('employees')
        .update({
          hire_date: update.hire_date,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', update.employee_id);
      
      if (error) {
        console.log(`❌ ${update.name} 입사일 수정 실패:`, error);
      } else {
        console.log(`✅ ${update.name} 입사일 수정 완료: ${update.hire_date}`);
      }
    }
    
    console.log('\n=== 수정 완료 ===');
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  updateHireDates().catch(console.error);
}

module.exports = { updateHireDates };
