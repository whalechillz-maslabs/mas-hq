#!/bin/bash

# MASLABS 백업 자동화 설정 스크립트
# 이 스크립트는 백업 시스템을 자동화하기 위한 크론탭을 설정합니다

echo "=== MASLABS 백업 자동화 설정 ==="

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "프로젝트 디렉토리: $PROJECT_DIR"

# 백업 디렉토리 생성
echo "백업 디렉토리 생성 중..."
mkdir -p "$PROJECT_DIR/backups/daily"
mkdir -p "$PROJECT_DIR/backups/weekly"
mkdir -p "$PROJECT_DIR/backups/monthly"
mkdir -p "$PROJECT_DIR/backups/manual"
mkdir -p "$PROJECT_DIR/backups/temp"

echo "✅ 백업 디렉토리 생성 완료"

# 크론탭 백업 (기존 설정 보존)
echo "기존 크론탭 백업 중..."
crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "기존 크론탭이 없습니다"

# 새로운 크론탭 설정
echo "새로운 백업 스케줄 설정 중..."

# 기존 크론탭 가져오기 (백업 관련 제외)
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -v "backup_scheduler.js" || echo "")

# 새로운 백업 스케줄 추가
NEW_CRON="$EXISTING_CRON

# MASLABS 백업 스케줄
# 매일 오전 2시에 일별 백업
0 2 * * * cd $PROJECT_DIR && node scripts/backup_scheduler.js >> logs/backup_daily.log 2>&1

# 매주 일요일 오전 3시에 주간 백업
0 3 * * 0 cd $PROJECT_DIR && node scripts/backup_scheduler.js >> logs/backup_weekly.log 2>&1

# 매월 1일 오전 4시에 월간 백업
0 4 1 * * cd $PROJECT_DIR && node scripts/backup_scheduler.js >> logs/backup_monthly.log 2>&1

# 매주 월요일 오전 5시에 백업 상태 확인
0 5 * * 1 cd $PROJECT_DIR && node scripts/backup_scheduler.js --status >> logs/backup_status.log 2>&1"

# 로그 디렉토리 생성
mkdir -p "$PROJECT_DIR/logs"

# 크론탭 설정
echo "$NEW_CRON" | crontab -

echo "✅ 크론탭 설정 완료"
echo ""
echo "설정된 백업 스케줄:"
echo "  - 일별 백업: 매일 오전 2시"
echo "  - 주간 백업: 매주 일요일 오전 3시"
echo "  - 월간 백업: 매월 1일 오전 4시"
echo "  - 상태 확인: 매주 월요일 오전 5시"
echo ""
echo "백업 로그 위치: $PROJECT_DIR/logs/"
echo "백업 파일 위치: $PROJECT_DIR/backups/"
echo ""

# 수동 백업 테스트
echo "수동 백업 테스트 실행 중..."
cd "$PROJECT_DIR"
node scripts/backup_scheduler.js --manual --reason=setup_test

echo ""
echo "=== 백업 자동화 설정 완료 ==="
echo ""
echo "다음 명령어로 백업 상태를 확인할 수 있습니다:"
echo "  node scripts/backup_scheduler.js --status"
echo ""
echo "수동 백업을 실행하려면:"
echo "  node scripts/backup_scheduler.js --manual --reason=your_reason"
echo ""
echo "크론탭을 확인하려면:"
echo "  crontab -l"
