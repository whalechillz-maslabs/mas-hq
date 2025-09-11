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
      throw empError;
    }
    
    console.log(`직원 데이터 ${employees.length}개 백업 완료`);
    
    // 2. 스케줄 데이터 백업
    console.log('\n2. 스케줄 데이터 백업 중...');
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*');
    
    if (scheduleError) {
      console.error('스케줄 데이터 백업 실패:', scheduleError);
      throw scheduleError;
    }
    
    console.log(`스케줄 데이터 ${schedules.length}개 백업 완료`);
    
    // 3. 시급 데이터 백업
    console.log('\n3. 시급 데이터 백업 중...');
    const { data: hourlyWages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*');
    
    if (wageError) {
      console.error('시급 데이터 백업 실패:', wageError);
      throw wageError;
    }
    
    console.log(`시급 데이터 ${hourlyWages.length}개 백업 완료`);
    
    // 4. 급여명세서 데이터 백업 (핵심!)
    console.log('\n4. 급여명세서 데이터 백업 중...');
    const { data: payslips, error: payslipError } = await supabase
      .from('payslips')
      .select(`
        *,
        employees:employee_id (
          name,
          employee_id
        )
      `);
    
    if (payslipError) {
      console.error('급여명세서 데이터 백업 실패:', payslipError);
      throw payslipError;
    }
    
    console.log(`급여명세서 데이터 ${payslips.length}개 백업 완료`);
    
    // 5. 업무 기록 데이터 백업
    console.log('\n5. 업무 기록 데이터 백업 중...');
    const { data: tasks, error: taskError } = await supabase
      .from('employee_tasks')
      .select(`
        *,
        operation_type:operation_types (
          code,
          name,
          points
        )
      `);
    
    if (taskError) {
      console.error('업무 기록 데이터 백업 실패:', taskError);
      throw taskError;
    }
    
    console.log(`업무 기록 데이터 ${tasks.length}개 백업 완료`);
    
    // 6. 출근 기록 데이터 백업 (선택적)
    console.log('\n6. 출근 기록 데이터 백업 중...');
    let attendance = [];
    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*');
      
      if (attendanceError) {
        console.warn('출근 기록 테이블이 없거나 접근할 수 없습니다:', attendanceError.message);
        attendance = [];
      } else {
        attendance = attendanceData || [];
      }
    } catch (error) {
      console.warn('출근 기록 데이터 백업 건너뜀:', error.message);
      attendance = [];
    }
    
    console.log(`출근 기록 데이터 ${attendance.length}개 백업 완료`);
    
    // 7. 업무 유형 데이터 백업
    console.log('\n7. 업무 유형 데이터 백업 중...');
    const { data: operationTypes, error: opTypeError } = await supabase
      .from('operation_types')
      .select('*');
    
    if (opTypeError) {
      console.error('업무 유형 데이터 백업 실패:', opTypeError);
      throw opTypeError;
    }
    
    console.log(`업무 유형 데이터 ${operationTypes.length}개 백업 완료`);
    
    // 8. 백업 데이터 검증
    console.log('\n8. 백업 데이터 검증 중...');
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      employees,
      schedules,
      hourlyWages,
      payslips,
      tasks,
      attendance,
      operationTypes,
      summary: {
        totalRecords: employees.length + schedules.length + hourlyWages.length + 
                     payslips.length + tasks.length + attendance.length + operationTypes.length,
        employees: employees.length,
        schedules: schedules.length,
        hourlyWages: hourlyWages.length,
        payslips: payslips.length,
        tasks: tasks.length,
        attendance: attendance.length,
        operationTypes: operationTypes.length
      }
    };
    
    // 백업 무결성 검증
    const requiredTables = ['employees', 'schedules', 'hourlyWages', 'payslips', 'tasks', 'attendance', 'operationTypes'];
    const missingTables = requiredTables.filter(table => !backupData[table] || backupData[table].length === 0);
    
    if (missingTables.length > 0) {
      console.warn(`⚠️  경고: 일부 테이블이 비어있습니다 - ${missingTables.join(', ')}`);
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // 백업 디렉토리 생성
    const backupDir = path.join(__dirname, '..', 'backups', 'temp');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFileName = `database_backup_${timestamp}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    console.log(`\n✅ 데이터베이스 백업 완료: ${backupFileName}`);
    console.log(`📊 백업 요약:`);
    console.log(`   - 직원: ${employees.length}개`);
    console.log(`   - 스케줄: ${schedules.length}개`);
    console.log(`   - 시급: ${hourlyWages.length}개`);
    console.log(`   - 급여명세서: ${payslips.length}개`);
    console.log(`   - 업무기록: ${tasks.length}개`);
    console.log(`   - 출근기록: ${attendance.length}개`);
    console.log(`   - 업무유형: ${operationTypes.length}개`);
    console.log(`   - 총 레코드: ${backupData.summary.totalRecords}개`);
    
    return backupFilePath;
    
  } catch (error) {
    console.error('백업 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 백업 실행
if (require.main === module) {
  backupDatabase().catch(console.error);
}

module.exports = { backupDatabase };