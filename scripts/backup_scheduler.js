const { backupDatabase } = require('./backup_database');
const fs = require('fs');
const path = require('path');

class BackupScheduler {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.retentionPolicies = {
      daily: 7,    // 일별 백업 7일 보관
      weekly: 4,   // 주별 백업 4주 보관
      monthly: 12  // 월별 백업 12개월 보관
    };
  }

  // 백업 타입 결정 (일/주/월)
  getBackupType() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const dayOfMonth = now.getDate();
    
    // 매월 1일: 월별 백업
    if (dayOfMonth === 1) {
      return 'monthly';
    }
    
    // 매주 일요일: 주별 백업
    if (dayOfWeek === 0) {
      return 'weekly';
    }
    
    // 그 외: 일별 백업
    return 'daily';
  }

  // 백업 실행
  async runScheduledBackup() {
    const backupType = this.getBackupType();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    console.log(`=== ${backupType.toUpperCase()} 백업 시작 (${timestamp}) ===`);
    
    try {
      // 백업 실행
      const backupFilePath = await backupDatabase();
      
      if (!backupFilePath) {
        throw new Error('백업 파일이 생성되지 않았습니다');
      }
      
      // 백업 타입별 디렉토리로 이동
      const typeDir = path.join(this.backupDir, backupType);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }
      
      const finalBackupPath = path.join(typeDir, `${backupType}_${timestamp}.json`);
      
      // 백업 파일을 타입별 디렉토리로 복사
      if (fs.existsSync(backupFilePath)) {
        fs.copyFileSync(backupFilePath, finalBackupPath);
        
        // 임시 파일 삭제
        fs.unlinkSync(backupFilePath);
        
        console.log(`✅ ${backupType} 백업 완료: ${finalBackupPath}`);
        
        // 백업 파일 크기 확인
        const stats = fs.statSync(finalBackupPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📁 백업 파일 크기: ${fileSizeInMB} MB`);
      }
      
      // 구데이터 정리
      await this.cleanupOldBackups(backupType);
      
      return finalBackupPath;
      
    } catch (error) {
      console.error(`❌ ${backupType} 백업 실패:`, error);
      throw error;
    }
  }

  // 구데이터 정리
  async cleanupOldBackups(backupType) {
    const typeDir = path.join(this.backupDir, backupType);
    
    if (!fs.existsSync(typeDir)) {
      return;
    }
    
    const retentionDays = this.retentionPolicies[backupType];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`\n🧹 ${backupType} 백업 정리 중... (${retentionDays}일 이상된 백업 삭제)`);
    
    try {
      const backupFiles = fs.readdirSync(typeDir)
        .filter(file => file.startsWith(backupType) && file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(typeDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            created: stats.birthtime,
            size: stats.size
          };
        })
        .sort((a, b) => b.created - a.created); // 최신순 정렬
      
      let deletedCount = 0;
      let totalSizeDeleted = 0;
      
      for (const file of backupFiles) {
        if (file.created < cutoffDate) {
          const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
          console.log(`  🗑️  삭제: ${file.name} (${file.created.toISOString().split('T')[0]}, ${fileSizeInMB}MB)`);
          fs.unlinkSync(file.path);
          deletedCount++;
          totalSizeDeleted += file.size;
        }
      }
      
      if (deletedCount > 0) {
        const totalSizeInMB = (totalSizeDeleted / (1024 * 1024)).toFixed(2);
        console.log(`✅ ${deletedCount}개의 구백업 삭제 완료 (${totalSizeInMB}MB 절약)`);
      } else {
        console.log(`✅ 삭제할 구백업 없음`);
      }
      
    } catch (error) {
      console.error(`❌ 백업 정리 실패:`, error);
    }
  }

  // 수동 백업 (중요 작업 전)
  async runManualBackup(reason = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    console.log(`=== 수동 백업 시작 (${reason}) ===`);
    
    try {
      const backupFilePath = await backupDatabase();
      
      if (!backupFilePath) {
        throw new Error('백업 파일이 생성되지 않았습니다');
      }
      
      // 수동 백업은 별도 디렉토리에 저장
      const manualDir = path.join(this.backupDir, 'manual');
      if (!fs.existsSync(manualDir)) {
        fs.mkdirSync(manualDir, { recursive: true });
      }
      
      const finalBackupPath = path.join(manualDir, `manual_${reason}_${timestamp}.json`);
      
      if (fs.existsSync(backupFilePath)) {
        fs.copyFileSync(backupFilePath, finalBackupPath);
        
        // 임시 파일 삭제
        fs.unlinkSync(backupFilePath);
        
        console.log(`✅ 수동 백업 완료: ${finalBackupPath}`);
        
        // 백업 파일 크기 확인
        const stats = fs.statSync(finalBackupPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📁 백업 파일 크기: ${fileSizeInMB} MB`);
      }
      
      return finalBackupPath;
      
    } catch (error) {
      console.error(`❌ 수동 백업 실패:`, error);
      throw error;
    }
  }

  // 백업 상태 확인
  getBackupStatus() {
    const status = {
      daily: { count: 0, latest: null, totalSize: 0 },
      weekly: { count: 0, latest: null, totalSize: 0 },
      monthly: { count: 0, latest: null, totalSize: 0 },
      manual: { count: 0, latest: null, totalSize: 0 }
    };
    
    for (const [type, info] of Object.entries(status)) {
      const typeDir = path.join(this.backupDir, type);
      
      if (fs.existsSync(typeDir)) {
        const files = fs.readdirSync(typeDir)
          .filter(file => file.startsWith(type) && file.endsWith('.json'))
          .map(file => {
            const filePath = path.join(typeDir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              created: stats.birthtime,
              size: stats.size
            };
          })
          .sort((a, b) => b.created - a.created);
        
        info.count = files.length;
        info.latest = files.length > 0 ? files[0].created : null;
        info.totalSize = files.reduce((sum, file) => sum + file.size, 0);
      }
    }
    
    return status;
  }
}

// 스크립트가 직접 실행될 때만 스케줄 백업 실행
if (require.main === module) {
  const scheduler = new BackupScheduler();
  
  // 명령행 인수 확인
  const args = process.argv.slice(2);
  
  if (args.includes('--manual')) {
    const reason = args.find(arg => arg.startsWith('--reason='))?.split('=')[1] || 'manual';
    scheduler.runManualBackup(reason).catch(console.error);
  } else if (args.includes('--status')) {
    const status = scheduler.getBackupStatus();
    console.log('=== 백업 상태 ===');
    for (const [type, info] of Object.entries(status)) {
      const totalSizeInMB = (info.totalSize / (1024 * 1024)).toFixed(2);
      console.log(`${type}: ${info.count}개 (최신: ${info.latest ? info.latest.toISOString().split('T')[0] : '없음'}, 총 크기: ${totalSizeInMB}MB)`);
    }
  } else {
    scheduler.runScheduledBackup().catch(console.error);
  }
}

module.exports = { BackupScheduler };
