const fs = require('fs');
const path = require('path');

class BackupCleanup {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.keepLatest = {
      manual: 1,    // 최신 수동 백업 1개만 유지
      daily: 0,     // 일별 백업 모두 삭제
      weekly: 0,    // 주별 백업 모두 삭제
      monthly: 0    // 월별 백업 모두 삭제
    };
  }

  // 백업 정리 실행
  async cleanup() {
    console.log('=== 구백업 정리 시작 ===');
    
    try {
      // 1. 구 수동 백업 삭제 (최신 1개만 유지)
      await this.cleanupManualBackups();
      
      // 2. 구 자동 백업 삭제 (모두 삭제)
      await this.cleanupAutoBackups();
      
      // 3. 정리 후 상태 확인
      this.showCleanupStatus();
      
      console.log('\n✅ 백업 정리 완료');
      
    } catch (error) {
      console.error('❌ 백업 정리 실패:', error);
      throw error;
    }
  }

  // 수동 백업 정리 (최신 1개만 유지)
  async cleanupManualBackups() {
    const manualDir = path.join(this.backupDir, 'manual');
    
    if (!fs.existsSync(manualDir)) {
      console.log('📁 수동 백업 디렉토리가 없습니다.');
      return;
    }

    console.log('\n🧹 수동 백업 정리 중...');
    
    const manualBackups = fs.readdirSync(manualDir)
      .filter(folder => folder.startsWith('manual_'))
      .map(folder => {
        const folderPath = path.join(manualDir, folder);
        const stats = fs.statSync(folderPath);
        return {
          name: folder,
          path: folderPath,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created); // 최신순 정렬

    console.log(`📊 발견된 수동 백업: ${manualBackups.length}개`);
    
    // 최신 1개를 제외하고 모두 삭제
    const toDelete = manualBackups.slice(1);
    
    for (const backup of toDelete) {
      console.log(`  🗑️  삭제: ${backup.name} (${backup.created.toISOString().split('T')[0]})`);
      fs.rmSync(backup.path, { recursive: true, force: true });
    }
    
    if (toDelete.length > 0) {
      console.log(`✅ ${toDelete.length}개의 구 수동 백업 삭제 완료`);
    } else {
      console.log(`✅ 삭제할 구 수동 백업 없음`);
    }
    
    // 최신 백업 정보 표시
    if (manualBackups.length > 0) {
      const latest = manualBackups[0];
      console.log(`📌 유지된 최신 백업: ${latest.name} (${latest.created.toISOString().split('T')[0]})`);
    }
  }

  // 자동 백업 정리 (모두 삭제)
  async cleanupAutoBackups() {
    console.log('\n🧹 자동 백업 정리 중...');
    
    const autoBackupDirs = fs.readdirSync(this.backupDir)
      .filter(folder => folder.match(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/))
      .map(folder => {
        const folderPath = path.join(this.backupDir, folder);
        const stats = fs.statSync(folderPath);
        return {
          name: folder,
          path: folderPath,
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created);

    console.log(`📊 발견된 자동 백업: ${autoBackupDirs.length}개`);
    
    for (const backup of autoBackupDirs) {
      console.log(`  🗑️  삭제: ${backup.name} (${backup.created.toISOString().split('T')[0]})`);
      fs.rmSync(backup.path, { recursive: true, force: true });
    }
    
    if (autoBackupDirs.length > 0) {
      console.log(`✅ ${autoBackupDirs.length}개의 자동 백업 삭제 완료`);
    } else {
      console.log(`✅ 삭제할 자동 백업 없음`);
    }
  }

  // 정리 후 상태 표시
  showCleanupStatus() {
    console.log('\n📊 정리 후 백업 상태:');
    
    if (!fs.existsSync(this.backupDir)) {
      console.log('📁 백업 디렉토리가 없습니다.');
      return;
    }

    const allBackups = fs.readdirSync(this.backupDir);
    
    // 수동 백업 상태
    const manualDir = path.join(this.backupDir, 'manual');
    if (fs.existsSync(manualDir)) {
      const manualBackups = fs.readdirSync(manualDir)
        .filter(folder => folder.startsWith('manual_'));
      console.log(`📁 수동 백업: ${manualBackups.length}개`);
      
      for (const backup of manualBackups) {
        const backupPath = path.join(manualDir, backup);
        const stats = fs.statSync(backupPath);
        console.log(`  - ${backup} (${stats.birthtime.toISOString().split('T')[0]})`);
      }
    } else {
      console.log('📁 수동 백업: 0개');
    }
    
    // 자동 백업 상태
    const autoBackups = allBackups.filter(folder => 
      folder.match(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/)
    );
    console.log(`📁 자동 백업: ${autoBackups.length}개`);
    
    if (autoBackups.length > 0) {
      console.log('  ⚠️  자동 백업이 남아있습니다. 수동으로 확인해주세요.');
    }
  }
}

// 스크립트가 직접 실행될 때만 정리 실행
if (require.main === module) {
  const cleanup = new BackupCleanup();
  cleanup.cleanup().catch(console.error);
}

module.exports = { BackupCleanup };
