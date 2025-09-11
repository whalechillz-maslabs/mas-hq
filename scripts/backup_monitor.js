const fs = require('fs');
const path = require('path');
const { BackupScheduler } = require('./backup_scheduler');

class BackupMonitor {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.logDir = path.join(__dirname, '..', 'logs');
    this.scheduler = new BackupScheduler();
  }

  // 백업 상태 상세 분석
  analyzeBackupHealth() {
    const status = this.scheduler.getBackupStatus();
    const now = new Date();
    
    const health = {
      overall: 'healthy',
      issues: [],
      warnings: [],
      recommendations: []
    };

    // 각 백업 타입별 상태 확인
    for (const [type, info] of Object.entries(status)) {
      if (type === 'manual') continue; // 수동 백업은 제외

      // 백업이 없는 경우
      if (info.count === 0) {
        health.issues.push(`${type} 백업이 없습니다`);
        health.overall = 'critical';
        continue;
      }

      // 최신 백업이 오래된 경우
      if (info.latest) {
        const daysSinceLastBackup = Math.floor((now - info.latest) / (1000 * 60 * 60 * 24));
        
        if (type === 'daily' && daysSinceLastBackup > 2) {
          health.issues.push(`일별 백업이 ${daysSinceLastBackup}일 전입니다`);
          health.overall = 'critical';
        } else if (type === 'weekly' && daysSinceLastBackup > 8) {
          health.issues.push(`주간 백업이 ${daysSinceLastBackup}일 전입니다`);
          health.overall = 'warning';
        } else if (type === 'monthly' && daysSinceLastBackup > 35) {
          health.issues.push(`월간 백업이 ${daysSinceLastBackup}일 전입니다`);
          health.overall = 'warning';
        }
      }

      // 백업 파일 크기 확인
      const avgSizeInMB = info.totalSize / (1024 * 1024) / info.count;
      if (avgSizeInMB < 0.1) {
        health.warnings.push(`${type} 백업 파일이 너무 작습니다 (${avgSizeInMB.toFixed(2)}MB)`);
      }
    }

    // 권장사항 생성
    if (health.issues.length > 0) {
      health.recommendations.push('즉시 백업을 실행하세요: node scripts/backup_scheduler.js --manual');
    }
    
    if (health.warnings.length > 0) {
      health.recommendations.push('백업 데이터를 확인하고 필요시 수동 백업을 실행하세요');
    }

    return health;
  }

  // 백업 통계 생성
  generateBackupStats() {
    const status = this.scheduler.getBackupStatus();
    const stats = {
      totalBackups: 0,
      totalSize: 0,
      oldestBackup: null,
      newestBackup: null,
      byType: {}
    };

    for (const [type, info] of Object.entries(status)) {
      stats.totalBackups += info.count;
      stats.totalSize += info.totalSize;
      
      stats.byType[type] = {
        count: info.count,
        size: info.totalSize,
        sizeInMB: (info.totalSize / (1024 * 1024)).toFixed(2),
        latest: info.latest
      };

      if (info.latest) {
        if (!stats.newestBackup || info.latest > stats.newestBackup) {
          stats.newestBackup = info.latest;
        }
        if (!stats.oldestBackup || info.latest < stats.oldestBackup) {
          stats.oldestBackup = info.latest;
        }
      }
    }

    stats.totalSizeInMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
    
    return stats;
  }

  // 백업 리포트 생성
  generateReport() {
    const health = this.analyzeBackupHealth();
    const stats = this.generateBackupStats();
    const now = new Date();

    const report = {
      timestamp: now.toISOString(),
      health,
      stats,
      summary: {
        status: health.overall,
        totalBackups: stats.totalBackups,
        totalSize: stats.totalSizeInMB + 'MB',
        lastBackup: stats.newestBackup ? stats.newestBackup.toISOString().split('T')[0] : '없음'
      }
    };

    return report;
  }

  // 리포트 출력
  printReport() {
    const report = this.generateReport();
    
    console.log('=== MASLABS 백업 모니터링 리포트 ===');
    console.log(`생성 시간: ${report.timestamp}`);
    console.log('');

    // 전체 상태
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '❌'
    };
    
    console.log(`전체 상태: ${statusEmoji[report.health.overall]} ${report.health.overall.toUpperCase()}`);
    console.log('');

    // 요약 정보
    console.log('📊 백업 요약:');
    console.log(`  - 총 백업 수: ${report.summary.totalBackups}개`);
    console.log(`  - 총 크기: ${report.summary.totalSize}`);
    console.log(`  - 최신 백업: ${report.summary.lastBackup}`);
    console.log('');

    // 백업 타입별 상세 정보
    console.log('📁 백업 타입별 상세:');
    for (const [type, info] of Object.entries(report.stats.byType)) {
      const latestDate = info.latest ? info.latest.toISOString().split('T')[0] : '없음';
      console.log(`  ${type}: ${info.count}개 (${info.sizeInMB}MB, 최신: ${latestDate})`);
    }
    console.log('');

    // 문제점 및 경고
    if (report.health.issues.length > 0) {
      console.log('❌ 문제점:');
      report.health.issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('');
    }

    if (report.health.warnings.length > 0) {
      console.log('⚠️  경고:');
      report.health.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log('');
    }

    // 권장사항
    if (report.health.recommendations.length > 0) {
      console.log('💡 권장사항:');
      report.health.recommendations.forEach(rec => console.log(`  - ${rec}`));
      console.log('');
    }

    // 백업 정책 정보
    console.log('📋 백업 정책:');
    console.log('  - 일별 백업: 7일 보관');
    console.log('  - 주간 백업: 4주 보관');
    console.log('  - 월간 백업: 12개월 보관');
    console.log('  - 수동 백업: 무제한 보관');
    console.log('');

    return report;
  }

  // 리포트를 파일로 저장
  saveReport() {
    const report = this.generateReport();
    const reportFile = path.join(this.logDir, `backup_report_${new Date().toISOString().split('T')[0]}.json`);
    
    // 로그 디렉토리 생성
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 리포트 저장: ${reportFile}`);
    
    return reportFile;
  }
}

// 스크립트가 직접 실행될 때만 모니터링 실행
if (require.main === module) {
  const monitor = new BackupMonitor();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--save')) {
    monitor.printReport();
    monitor.saveReport();
  } else {
    monitor.printReport();
  }
}

module.exports = { BackupMonitor };
