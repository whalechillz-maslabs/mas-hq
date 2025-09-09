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
      const backupPath = await backupDatabase();
      
      // 백업 타입별 디렉토리로 이동
      const typeDir = path.join(this.backupDir, backupType);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }
      
      const finalBackupPath = path.join(typeDir, `${backupType}_${timestamp}`);
      
      // 백업 폴더를 타입별 디렉토리로 이동
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, finalBackupPath);
        console.log(`✅ ${backupType} 백업 완료: ${finalBackupPath}`);
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
      const backupFolders = fs.readdirSync(typeDir)
        .filter(folder => folder.startsWith(backupType))
        .map(folder => {
          const folderPath = path.join(typeDir, folder);
          const stats = fs.statSync(folderPath);
          return {
            name: folder,
            path: folderPath,
            created: stats.birthtime
          };
        })
        .sort((a, b) => b.created - a.created); // 최신순 정렬
      
      let deletedCount = 0;
      
      for (const folder of backupFolders) {
        if (folder.created < cutoffDate) {
          console.log(`  🗑️  삭제: ${folder.name} (${folder.created.toISOString().split('T')[0]})`);
          fs.rmSync(folder.path, { recursive: true, force: true });
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        console.log(`✅ ${deletedCount}개의 구백업 삭제 완료`);
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
      const backupPath = await backupDatabase();
      
      // 수동 백업은 별도 디렉토리에 저장
      const manualDir = path.join(this.backupDir, 'manual');
      if (!fs.existsSync(manualDir)) {
        fs.mkdirSync(manualDir, { recursive: true });
      }
      
      const finalBackupPath = path.join(manualDir, `manual_${reason}_${timestamp}`);
      
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, finalBackupPath);
        console.log(`✅ 수동 백업 완료: ${finalBackupPath}`);
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
      daily: { count: 0, latest: null },
      weekly: { count: 0, latest: null },
      monthly: { count: 0, latest: null },
      manual: { count: 0, latest: null }
    };
    
    for (const [type, info] of Object.entries(status)) {
      const typeDir = path.join(this.backupDir, type);
      
      if (fs.existsSync(typeDir)) {
        const folders = fs.readdirSync(typeDir)
          .filter(folder => folder.startsWith(type))
          .map(folder => {
            const folderPath = path.join(typeDir, folder);
            const stats = fs.statSync(folderPath);
            return {
              name: folder,
              created: stats.birthtime
            };
          })
          .sort((a, b) => b.created - a.created);
        
        info.count = folders.length;
        info.latest = folders.length > 0 ? folders[0].created : null;
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
      console.log(`${type}: ${info.count}개 (최신: ${info.latest ? info.latest.toISOString().split('T')[0] : '없음'})`);
    }
  } else {
    scheduler.runScheduledBackup().catch(console.error);
  }
}

module.exports = { BackupScheduler };
