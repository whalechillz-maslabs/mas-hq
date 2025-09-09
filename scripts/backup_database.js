const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function backupDatabase() {
  console.log('=== 데이터베이스 백업 시작 ===');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  
  const backupDir = path.join(__dirname, '..', 'backups', timestamp);
  
  // 백업 디렉토리 생성
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  try {
    // 1. employees 테이블 백업
    console.log('\n1. employees 테이블 백업 중...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*');
    
    if (employeesError) {
      console.log('❌ employees 백업 실패:', employeesError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'employees.json'), 
        JSON.stringify(employees, null, 2)
      );
      console.log(`✅ employees 백업 완료 (${employees.length}개 레코드)`);
    }
    
    // 2. schedules 테이블 백업
    console.log('\n2. schedules 테이블 백업 중...');
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*');
    
    if (schedulesError) {
      console.log('❌ schedules 백업 실패:', schedulesError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'schedules.json'), 
        JSON.stringify(schedules, null, 2)
      );
      console.log(`✅ schedules 백업 완료 (${schedules.length}개 레코드)`);
    }
    
    // 3. employee_tasks 테이블 백업
    console.log('\n3. employee_tasks 테이블 백업 중...');
    const { data: tasks, error: tasksError } = await supabase
      .from('employee_tasks')
      .select('*');
    
    if (tasksError) {
      console.log('❌ employee_tasks 백업 실패:', tasksError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'employee_tasks.json'), 
        JSON.stringify(tasks, null, 2)
      );
      console.log(`✅ employee_tasks 백업 완료 (${tasks.length}개 레코드)`);
    }
    
    // 4. salaries 테이블 백업
    console.log('\n4. salaries 테이블 백업 중...');
    const { data: salaries, error: salariesError } = await supabase
      .from('salaries')
      .select('*');
    
    if (salariesError) {
      console.log('❌ salaries 백업 실패:', salariesError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'salaries.json'), 
        JSON.stringify(salaries, null, 2)
      );
      console.log(`✅ salaries 백업 완료 (${salaries.length}개 레코드)`);
    }
    
    // 5. operation_types 테이블 백업
    console.log('\n5. operation_types 테이블 백업 중...');
    const { data: operationTypes, error: operationTypesError } = await supabase
      .from('operation_types')
      .select('*');
    
    if (operationTypesError) {
      console.log('❌ operation_types 백업 실패:', operationTypesError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'operation_types.json'), 
        JSON.stringify(operationTypes, null, 2)
      );
      console.log(`✅ operation_types 백업 완료 (${operationTypes.length}개 레코드)`);
    }
    
    // 6. contracts 테이블 백업
    console.log('\n6. contracts 테이블 백업 중...');
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*');
    
    if (contractsError) {
      console.log('❌ contracts 백업 실패:', contractsError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'contracts.json'), 
        JSON.stringify(contracts, null, 2)
      );
      console.log(`✅ contracts 백업 완료 (${contracts.length}개 레코드)`);
    }
    
    // 7. daily_work_records 테이블 백업
    console.log('\n7. daily_work_records 테이블 백업 중...');
    const { data: workRecords, error: workRecordsError } = await supabase
      .from('daily_work_records')
      .select('*');
    
    if (workRecordsError) {
      console.log('❌ daily_work_records 백업 실패:', workRecordsError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'daily_work_records.json'), 
        JSON.stringify(workRecords, null, 2)
      );
      console.log(`✅ daily_work_records 백업 완료 (${workRecords.length}개 레코드)`);
    }
    
    // 8. weekly_settlements 테이블 백업
    console.log('\n8. weekly_settlements 테이블 백업 중...');
    const { data: settlements, error: settlementsError } = await supabase
      .from('weekly_settlements')
      .select('*');
    
    if (settlementsError) {
      console.log('❌ weekly_settlements 백업 실패:', settlementsError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'weekly_settlements.json'), 
        JSON.stringify(settlements, null, 2)
      );
      console.log(`✅ weekly_settlements 백업 완료 (${settlements.length}개 레코드)`);
    }
    
    // 9. hourly_wages 테이블 백업
    console.log('\n9. hourly_wages 테이블 백업 중...');
    const { data: hourlyWages, error: hourlyWagesError } = await supabase
      .from('hourly_wages')
      .select('*');
    
    if (hourlyWagesError) {
      console.log('❌ hourly_wages 백업 실패:', hourlyWagesError);
    } else {
      fs.writeFileSync(
        path.join(backupDir, 'hourly_wages.json'), 
        JSON.stringify(hourlyWages, null, 2)
      );
      console.log(`✅ hourly_wages 백업 완료 (${hourlyWages.length}개 레코드)`);
    }
    
    // 10. 백업 메타데이터 생성
    const backupMetadata = {
      timestamp: new Date().toISOString(),
      backup_type: 'full',
      tables_backed_up: [
        'employees', 'schedules', 'employee_tasks', 'salaries', 
        'operation_types', 'contracts', 'daily_work_records', 'weekly_settlements', 'hourly_wages'
      ],
      total_records: {
        employees: employees?.length || 0,
        schedules: schedules?.length || 0,
        employee_tasks: tasks?.length || 0,
        salaries: salaries?.length || 0,
        operation_types: operationTypes?.length || 0,
        contracts: contracts?.length || 0,
        daily_work_records: workRecords?.length || 0,
        weekly_settlements: settlements?.length || 0,
        hourly_wages: hourlyWages?.length || 0
      }
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'backup_metadata.json'), 
      JSON.stringify(backupMetadata, null, 2)
    );
    
    console.log(`\n✅ 전체 백업 완료: ${backupDir}`);
    console.log(`📊 총 백업된 레코드 수: ${Object.values(backupMetadata.total_records).reduce((a, b) => a + b, 0)}개`);
    
    return backupDir;
    
  } catch (error) {
    console.error('❌ 백업 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트가 직접 실행될 때만 백업 실행
if (require.main === module) {
  backupDatabase().catch(console.error);
}

module.exports = { backupDatabase };
