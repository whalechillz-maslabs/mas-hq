const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function updateAllEmployees() {
  console.log('=== 모든 직원 정보 업데이트 ===');
  
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
    
    // 2. 직원 정보 업데이트
    console.log('\n2. 직원 정보 업데이트 중...');
    
    const employeeUpdates = [
      {
        employee_id: 'MASLABS-001',
        name: '김탁수',
        email: 'maslabs-001@maslabs.kr',
        phone: '010-6669-9000',
        password_hash: '66699000',
        employment_type: 'full_time',
        monthly_salary: 3000000,
        hourly_rate: null,
        nickname: '김탁수',
        pin_code: '1234'
      },
      {
        employee_id: 'MASLABS-002',
        name: '이은정',
        email: 'maslabs-002@maslabs.kr',
        phone: '010-3243-3099',
        password_hash: '32433099',
        employment_type: 'full_time',
        monthly_salary: 2000000,
        hourly_rate: null,
        nickname: '이은정',
        pin_code: '1234'
      },
      {
        employee_id: 'MASLABS-003',
        name: '허상원',
        email: 'maslabs-003@maslabs.kr',
        phone: '010-8948-4501',
        password_hash: '89484501',
        employment_type: 'part_time',
        monthly_salary: null,
        hourly_rate: 13000,
        nickname: '허상원',
        pin_code: '1234'
      },
      {
        employee_id: 'MASLABS-004',
        name: '최형호',
        email: 'maslabs-004@maslabs.kr',
        phone: '010-7128-4590',
        password_hash: '71284590',
        employment_type: 'full_time',
        monthly_salary: 1680000,
        hourly_rate: null,
        nickname: '최형호',
        pin_code: '1234'
      },
      {
        employee_id: 'MASLABS-005',
        name: '나수진',
        email: 'maslabs-005@maslabs.kr',
        phone: '010-2391-4431',
        password_hash: '23914431',
        employment_type: 'full_time',
        monthly_salary: 1000000,
        hourly_rate: null,
        nickname: '나수진',
        pin_code: '1234'
      },
      {
        employee_id: 'MASLABS-006',
        name: '하상희',
        email: 'maslabs-006@maslabs.kr',
        phone: '010-2576-7885',
        password_hash: '25767885',
        employment_type: 'part_time',
        monthly_salary: null,
        hourly_rate: 12000,
        nickname: '하상희',
        pin_code: '1234'
      }
    ];
    
    // 3. 각 직원 정보 업데이트
    for (const updateData of employeeUpdates) {
      console.log(`\n${updateData.name} (${updateData.employee_id}) 업데이트 중...`);
      
      // 기존 직원 찾기
      const existingEmployee = currentEmployees.find(emp => emp.employee_id === updateData.employee_id);
      
      if (existingEmployee) {
        // 기존 직원 업데이트
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            name: updateData.name,
            email: updateData.email,
            phone: updateData.phone,
            password_hash: updateData.password_hash,
            employment_type: updateData.employment_type,
            monthly_salary: updateData.monthly_salary,
            hourly_rate: updateData.hourly_rate,
            nickname: updateData.nickname,
            pin_code: updateData.pin_code,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEmployee.id);
        
        if (updateError) {
          console.log(`❌ ${updateData.name} 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ ${updateData.name} 업데이트 완료`);
        }
      } else {
        // 새 직원 추가
        const { error: insertError } = await supabase
          .from('employees')
          .insert({
            ...updateData,
            hire_date: '2025-01-01',
            status: 'active',
            is_active: true
          });
        
        if (insertError) {
          console.log(`❌ ${updateData.name} 추가 실패:`, insertError);
        } else {
          console.log(`✅ ${updateData.name} 추가 완료`);
        }
      }
    }
    
    // 4. 허상원과 하상희 시급 데이터 추가
    console.log('\n3. 파트타임 직원 시급 데이터 추가 중...');
    
    // 허상원 시급 데이터
    const { data: heoEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', 'MASLABS-003')
      .single();
    
    if (heoEmployee) {
      const { error: heoWageError } = await supabase
        .from('hourly_wages')
        .insert({
          employee_id: heoEmployee.id,
          base_wage: 13000,
          effective_start_date: '2025-01-01',
          effective_end_date: null,
          status: 'active'
        });
      
      if (heoWageError) {
        console.log('❌ 허상원 시급 데이터 추가 실패:', heoWageError);
      } else {
        console.log('✅ 허상원 시급 데이터 추가 완료 (13,000원)');
      }
    }
    
    // 하상희 시급 데이터
    const { data: haEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', 'MASLABS-006')
      .single();
    
    if (haEmployee) {
      const { error: haWageError } = await supabase
        .from('hourly_wages')
        .insert({
          employee_id: haEmployee.id,
          base_wage: 12000,
          effective_start_date: '2025-01-01',
          effective_end_date: null,
          status: 'active'
        });
      
      if (haWageError) {
        console.log('❌ 하상희 시급 데이터 추가 실패:', haWageError);
      } else {
        console.log('✅ 하상희 시급 데이터 추가 완료 (12,000원)');
      }
    }
    
    // 5. 최종 확인
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
    
    console.log(`\n✅ 총 ${finalEmployees.length}명의 직원 정보가 업데이트되었습니다.`);
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  updateAllEmployees().catch(console.error);
}

module.exports = { updateAllEmployees };
