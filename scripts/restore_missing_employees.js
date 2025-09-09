const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function restoreMissingEmployees() {
  console.log('=== 누락된 직원 데이터 복구 시작 ===');
  
  try {
    // 1. 현재 직원 목록 확인
    console.log('\n1. 현재 직원 목록 확인 중...');
    const { data: currentEmployees, error: currentError } = await supabase
      .from('employees')
      .select('id, name, employee_id, email, phone, employment_type');
    
    if (currentError) {
      console.log('❌ 현재 직원 목록 확인 실패:', currentError);
      return;
    }
    
    console.log('현재 직원 목록:');
    currentEmployees.forEach(emp => {
      console.log(`  - ${emp.name} (${emp.employee_id}) - ${emp.employment_type}`);
    });
    
    // 2. 누락된 직원들 추가
    console.log('\n2. 누락된 직원들 추가 중...');
    
    // 김탁수 추가
    const kimTakSu = {
      employee_id: 'MASLABS-001',
      name: '김탁수',
      email: 'maslabs-001@maslabs.kr',
      phone: '010-6669-9000',
      password_hash: '66699000',
      hire_date: '2025-01-01',
      employment_type: 'full_time',
      status: 'active',
      is_active: true,
      nickname: '김탁수',
      pin_code: '1234'
    };
    
    // 허상원 추가
    const heoSangWon = {
      employee_id: 'MASLABS-003',
      name: '허상원',
      email: 'maslabs-003@maslabs.kr',
      phone: '010-8948-4501',
      password_hash: '89484501',
      hire_date: '2025-01-01',
      employment_type: 'full_time',
      status: 'active',
      is_active: true,
      nickname: '허상원',
      pin_code: '1234'
    };
    
    // 최형호 추가
    const choiHyungHo = {
      employee_id: 'MASLABS-004',
      name: '최형호',
      email: 'maslabs-004@maslabs.kr',
      phone: '010-7128-4590',
      password_hash: '71284590',
      hire_date: '2025-01-01',
      employment_type: 'part_time',
      status: 'active',
      is_active: true,
      nickname: '최형호',
      pin_code: '1234',
      hourly_rate: 12000
    };
    
    // 하상희 추가
    const haSangHee = {
      employee_id: 'MASLABS-006',
      name: '하상희',
      email: 'maslabs-006@maslabs.kr',
      phone: '010-2576-7885',
      password_hash: '25767885',
      hire_date: '2025-01-01',
      employment_type: 'part_time',
      status: 'active',
      is_active: true,
      nickname: '하상희',
      pin_code: '1234',
      hourly_rate: 12000
    };
    
    // 나수진 추가
    const naSuJin = {
      employee_id: 'MASLABS-005',
      name: '나수진',
      email: 'maslabs-005@maslabs.kr',
      phone: '010-2391-4431',
      password_hash: '23914431',
      hire_date: '2025-01-01',
      employment_type: 'full_time',
      status: 'active',
      is_active: true,
      nickname: '나수진',
      pin_code: '1234'
    };
    
    const employeesToAdd = [kimTakSu, heoSangWon, choiHyungHo, haSangHee, naSuJin];
    
    for (const employee of employeesToAdd) {
      // 기존 직원이 있는지 확인
      const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_id', employee.employee_id)
        .single();
      
      if (existing) {
        console.log(`⚠️  ${employee.name} (${employee.employee_id})는 이미 존재합니다.`);
        continue;
      }
      
      const { error } = await supabase
        .from('employees')
        .insert(employee);
      
      if (error) {
        console.log(`❌ ${employee.name} 추가 실패:`, error);
      } else {
        console.log(`✅ ${employee.name} (${employee.employee_id}) 추가 완료`);
      }
    }
    
    // 3. 최종 직원 목록 확인
    console.log('\n3. 최종 직원 목록 확인 중...');
    const { data: finalEmployees, error: finalError } = await supabase
      .from('employees')
      .select('id, name, employee_id, email, phone, employment_type, hourly_rate, monthly_salary')
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
    
    console.log(`\n✅ 총 ${finalEmployees.length}명의 직원이 등록되었습니다.`);
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  restoreMissingEmployees().catch(console.error);
}

module.exports = { restoreMissingEmployees };
