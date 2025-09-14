const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 설정 (실제 프로젝트 설정)
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 백업할 테이블 목록
const tables = [
  'employees',
  'payslips', 
  'schedules',
  'hourly_wages',
  'attendance',
  'employee_tasks',
  'operation_types'
];

async function backupTable(tableName) {
  try {
    console.log(`📊 ${tableName} 테이블 백업 중...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      throw error;
    }

    // 백업 데이터를 JSON 파일로 저장
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${tableName}_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`✅ ${tableName} 백업 완료: ${data.length}개 레코드`);
    console.log(`   파일 위치: ${filepath}`);
    
    return {
      table: tableName,
      recordCount: data.length,
      filepath: filepath
    };
  } catch (error) {
    console.error(`❌ ${tableName} 백업 실패:`, error.message);
    return {
      table: tableName,
      error: error.message
    };
  }
}

async function createBackupSummary(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summaryFile = path.join(__dirname, 'backups', `backup_summary_${timestamp}.json`);
  
  const summary = {
    backupDate: new Date().toISOString(),
    totalTables: results.length,
    successfulBackups: results.filter(r => !r.error).length,
    failedBackups: results.filter(r => r.error).length,
    totalRecords: results.reduce((sum, r) => sum + (r.recordCount || 0), 0),
    results: results
  };

  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`\n📋 백업 요약 저장: ${summaryFile}`);
  
  return summary;
}

async function main() {
  console.log('🚀 데이터베이스 백업 시작...\n');
  
  const results = [];
  
  for (const table of tables) {
    const result = await backupTable(table);
    results.push(result);
    
    // API 호출 제한을 피하기 위한 대기
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 백업 결과 요약:');
  console.log('='.repeat(50));
  
  let totalRecords = 0;
  let successCount = 0;
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.table}: 실패 - ${result.error}`);
    } else {
      console.log(`✅ ${result.table}: ${result.recordCount}개 레코드`);
      totalRecords += result.recordCount;
      successCount++;
    }
  });
  
  console.log('='.repeat(50));
  console.log(`📈 총 ${successCount}/${tables.length}개 테이블 백업 완료`);
  console.log(`📊 총 ${totalRecords}개 레코드 백업됨`);
  
  // 백업 요약 생성
  await createBackupSummary(results);
  
  console.log('\n🎉 데이터베이스 백업 완료!');
}

// 스크립트 실행
main().catch(console.error);