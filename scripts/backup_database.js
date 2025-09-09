const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function backupDatabase() {
  try {
    console.log('=== 데이터베이스 백업 시작 ===');
    
    // 1. 직원 데이터 백업
    console.log('\n1. 직원 데이터 백업 중...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*');
    
    if (empError) {
      console.error('직원 데이터 백업 실패:', empError);
      return;
    }
    
    console.log(`직원 데이터 ${employees.length}개 백업 완료`);
    
    // 2. 스케줄 데이터 백업
    console.log('\n2. 스케줄 데이터 백업 중...');
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*');
    
    if (scheduleError) {
      console.error('스케줄 데이터 백업 실패:', scheduleError);
      return;
    }
    
    console.log(`스케줄 데이터 ${schedules.length}개 백업 완료`);
    
    // 3. 시급 데이터 백업
    console.log('\n3. 시급 데이터 백업 중...');
    const { data: hourlyWages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*');
    
    if (wageError) {
      console.error('시급 데이터 백업 실패:', wageError);
      return;
    }
    
    console.log(`시급 데이터 ${hourlyWages.length}개 백업 완료`);
    
    // 4. 백업 파일 생성
    const backupData = {
      timestamp: new Date().toISOString(),
      employees,
      schedules,
      hourlyWages
    };
    
    const fs = require('fs');
    const backupFileName = `database_backup_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    
    console.log(`\n✅ 데이터베이스 백업 완료: ${backupFileName}`);
    console.log(`- 직원: ${employees.length}개`);
    console.log(`- 스케줄: ${schedules.length}개`);
    console.log(`- 시급: ${hourlyWages.length}개`);
    
    return backupData;
    
  } catch (error) {
    console.error('백업 중 오류 발생:', error);
  }
}

backupDatabase();