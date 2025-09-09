const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function cleanupDuplicateEmployees() {
  console.log('=== 중복 직원 정리 ===');
  
  try {
    // 1. 현재 직원 목록 확인
    console.log('\n1. 현재 직원 목록 확인 중...');
    const { data: currentEmployees, error: currentError } = await supabase
      .from('employees')
      .select('id, name, employee_id, email, phone, employment_type, hourly_rate, monthly_salary')
      .order('employee_id');
    
    if (currentError) {
      console.log('❌ 현재 직원 목록 확인 실패:', currentError);
      return;
    }
    
    console.log('현재 직원 목록:');
    currentEmployees.forEach(emp => {
      console.log(`  - ${emp.name} (${emp.employee_id}) - ${emp.employment_type}`);
    });
    
    // 2. 중복된 이은정 정리 (MASLABS-004 삭제, MASLABS-002 유지)
    console.log('\n2. 중복된 이은정 정리 중...');
    
    const duplicateEunjung = currentEmployees.find(emp => 
      emp.employee_id === 'MASLABS-004' && emp.name === '이은정'
    );
    
    if (duplicateEunjung) {
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', duplicateEunjung.id);
      
      if (deleteError) {
        console.log('❌ 중복된 이은정 삭제 실패:', deleteError);
      } else {
        console.log('✅ 중복된 이은정 (MASLABS-004) 삭제 완료');
      }
    }
    
    // 3. 최형호 정보 수정 (MASLABS-007을 MASLABS-004로 변경)
    console.log('\n3. 최형호 정보 수정 중...');
    
    const choiEmployee = currentEmployees.find(emp => 
      emp.employee_id === 'MASLABS-007' && emp.name === '최형호'
    );
    
    if (choiEmployee) {
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          employee_id: 'MASLABS-004',
          email: 'maslabs-004@maslabs.kr',
          phone: '010-7128-4590',
          password_hash: '71284590',
          employment_type: 'full_time',
          monthly_salary: 1680000,
          hourly_rate: null,
          nickname: '최형호',
          pin_code: '1234',
          updated_at: new Date().toISOString()
        })
        .eq('id', choiEmployee.id);
      
      if (updateError) {
        console.log('❌ 최형호 정보 수정 실패:', updateError);
      } else {
        console.log('✅ 최형호 정보 수정 완료 (MASLABS-004)');
      }
    }
    
    // 4. 최종 확인
    console.log('\n4. 최종 직원 목록 확인 중...');
    const { data: finalEmployees, error: finalError } = await supabase
      .from('employees')
      .select('id, name, employee_id, email, phone, employment_type, hourly_rate, monthly_salary, pin_code')
      .order('employee_id');
    
    if (finalError) {
      console.log('❌ 최종 직원 목록 확인 실패:', finalError);
      return;
    }
    
    console.log('\n=== 최종 직원 목록 ===');
    finalEmployees.forEach(emp => {
      const wageInfo = emp.employment_type === 'part_time' 
        ? `시급: ${emp.hourly_rate?.toLocaleString() || '미설정'}원`
        : `월급: ${emp.monthly_salary?.toLocaleString() || '미설정'}원`;
      
      console.log(`  - ${emp.name} (${emp.employee_id}) - ${emp.employment_type} - ${wageInfo}`);
    });
    
    console.log(`\n✅ 총 ${finalEmployees.length}명의 직원이 정리되었습니다.`);
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  cleanupDuplicateEmployees().catch(console.error);
}

module.exports = { cleanupDuplicateEmployees };
