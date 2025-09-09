const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function restoreDatabase() {
  console.log('=== 데이터베이스 복구 시작 ===');
  
  // 가장 완전한 백업 디렉토리 선택
  const backupDir = path.join(__dirname, '..', 'backups', 'manual', 'manual_hourly_wages_테이블_생성_전_2025-09-08_08-08-55');
  
  if (!fs.existsSync(backupDir)) {
    console.error('❌ 백업 디렉토리를 찾을 수 없습니다:', backupDir);
    return;
  }
  
  try {
    // 1. employees 테이블 복구
    console.log('\n1. employees 테이블 복구 중...');
    const employeesData = JSON.parse(fs.readFileSync(path.join(backupDir, 'employees.json'), 'utf8'));
    
    for (const employee of employeesData) {
      const { error } = await supabase
        .from('employees')
        .upsert(employee, { onConflict: 'id' });
      
      if (error) {
        console.log(`❌ 직원 ${employee.name} 복구 실패:`, error);
      } else {
        console.log(`✅ 직원 ${employee.name} 복구 완료`);
      }
    }
    
    // 2. schedules 테이블 복구
    console.log('\n2. schedules 테이블 복구 중...');
    const schedulesData = JSON.parse(fs.readFileSync(path.join(backupDir, 'schedules.json'), 'utf8'));
    
    // 배치로 삽입 (한 번에 100개씩)
    const batchSize = 100;
    for (let i = 0; i < schedulesData.length; i += batchSize) {
      const batch = schedulesData.slice(i, i + batchSize);
      const { error } = await supabase
        .from('schedules')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.log(`❌ 스케줄 배치 ${i + 1}-${Math.min(i + batchSize, schedulesData.length)} 복구 실패:`, error);
      } else {
        console.log(`✅ 스케줄 배치 ${i + 1}-${Math.min(i + batchSize, schedulesData.length)} 복구 완료`);
      }
    }
    
    // 3. operation_types 테이블 복구
    console.log('\n3. operation_types 테이블 복구 중...');
    const operationTypesData = JSON.parse(fs.readFileSync(path.join(backupDir, 'operation_types.json'), 'utf8'));
    
    for (const operationType of operationTypesData) {
      const { error } = await supabase
        .from('operation_types')
        .upsert(operationType, { onConflict: 'id' });
      
      if (error) {
        console.log(`❌ 업무유형 ${operationType.name} 복구 실패:`, error);
      } else {
        console.log(`✅ 업무유형 ${operationType.name} 복구 완료`);
      }
    }
    
    // 4. salaries 테이블 복구 (테이블이 존재하는 경우)
    console.log('\n4. salaries 테이블 복구 중...');
    const salariesPath = path.join(backupDir, 'salaries.json');
    if (fs.existsSync(salariesPath)) {
      const salariesData = JSON.parse(fs.readFileSync(salariesPath, 'utf8'));
      
      for (const salary of salariesData) {
        const { error } = await supabase
          .from('salaries')
          .upsert(salary, { onConflict: 'id' });
        
        if (error) {
          console.log(`❌ 급여 데이터 복구 실패:`, error);
        } else {
          console.log(`✅ 급여 데이터 복구 완료`);
        }
      }
    } else {
      console.log('⚠️  salaries.json 파일이 없습니다.');
    }
    
    // 5. contracts 테이블 복구 (테이블이 존재하는 경우)
    console.log('\n5. contracts 테이블 복구 중...');
    const contractsPath = path.join(backupDir, 'contracts.json');
    if (fs.existsSync(contractsPath)) {
      const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
      
      for (const contract of contractsData) {
        const { error } = await supabase
          .from('contracts')
          .upsert(contract, { onConflict: 'id' });
        
        if (error) {
          console.log(`❌ 계약 데이터 복구 실패:`, error);
        } else {
          console.log(`✅ 계약 데이터 복구 완료`);
        }
      }
    } else {
      console.log('⚠️  contracts.json 파일이 없습니다.');
    }
    
    // 6. 복구 결과 확인
    console.log('\n6. 복구 결과 확인 중...');
    
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, employee_id, employment_type');
    
    if (employeesError) {
      console.log('❌ 직원 데이터 확인 실패:', employeesError);
    } else {
      console.log(`✅ 복구된 직원 수: ${employees.length}명`);
      employees.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.employee_id}) - ${emp.employment_type}`);
      });
    }
    
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('id, employee_id, date')
      .limit(5);
    
    if (schedulesError) {
      console.log('❌ 스케줄 데이터 확인 실패:', schedulesError);
    } else {
      console.log(`✅ 복구된 스케줄 수: ${schedules.length}개 (샘플)`);
    }
    
    const { data: operationTypes, error: operationTypesError } = await supabase
      .from('operation_types')
      .select('id, name, code');
    
    if (operationTypesError) {
      console.log('❌ 업무유형 데이터 확인 실패:', operationTypesError);
    } else {
      console.log(`✅ 복구된 업무유형 수: ${operationTypes.length}개`);
      operationTypes.forEach(op => {
        console.log(`  - ${op.name} (${op.code})`);
      });
    }
    
    console.log('\n=== 데이터베이스 복구 완료 ===');
    
  } catch (error) {
    console.error('❌ 복구 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 복구 실행
if (require.main === module) {
  restoreDatabase().catch(console.error);
}

module.exports = { restoreDatabase };
