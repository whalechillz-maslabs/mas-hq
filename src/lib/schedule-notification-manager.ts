// 스케줄 변경사항을 임시 저장하고 일일 보고서로 전송하는 매니저

interface ScheduleChange {
  id: string;
  action: 'create' | 'update' | 'delete';
  schedule: any;
  employee: {
    name: string;
    employee_id: string;
  };
  timestamp: string;
}

class ScheduleNotificationManager {
  private static instance: ScheduleNotificationManager;
  private changes: ScheduleChange[] = [];
  private lastReportDate: string | null = null;

  private constructor() {}

  public static getInstance(): ScheduleNotificationManager {
    if (!ScheduleNotificationManager.instance) {
      ScheduleNotificationManager.instance = new ScheduleNotificationManager();
    }
    return ScheduleNotificationManager.instance;
  }

  // 스케줄 변경사항 추가
  public addChange(change: Omit<ScheduleChange, 'id' | 'timestamp'>): void {
    const newChange: ScheduleChange = {
      ...change,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.changes.push(newChange);
    console.log('📝 스케줄 변경사항 추가:', newChange);

    // 자동으로 일일 보고서 전송 체크
    this.checkAndSendDailyReport();
  }

  // 일일 보고서 전송 체크
  private async checkAndSendDailyReport(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 이미 보고서를 보냈으면 스킵
    if (this.lastReportDate === today) {
      return;
    }

    // 오후 6시 이후이거나 변경사항이 5개 이상일 때 보고서 전송
    const now = new Date();
    const isAfter6PM = now.getHours() >= 18;
    const hasEnoughChanges = this.changes.length >= 5;

    if (isAfter6PM || hasEnoughChanges) {
      await this.sendDailyReport(today);
    }
  }

  // 일일 보고서 전송
  public async sendDailyReport(reportDate?: string): Promise<void> {
    const date = reportDate || new Date().toISOString().split('T')[0];
    
    if (this.changes.length === 0) {
      console.log('📋 변경사항이 없어 보고서를 전송하지 않습니다.');
      // 변경사항이 없어도 사용자에게 알림 표시
      this.showNotification('변경사항이 없어 보고서를 전송하지 않습니다.', 'info');
      return;
    }

    try {
      const response = await fetch('/api/schedule-daily-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportDate: date,
          changes: this.changes
        }),
      });

      if (response.ok) {
        console.log('✅ 일일 스케줄 보고서 전송 완료');
        this.showNotification('일일 스케줄 보고서가 전송되었습니다!', 'success');
        this.changes = []; // 전송 후 초기화
        this.lastReportDate = date;
      } else {
        console.error('❌ 일일 스케줄 보고서 전송 실패:', response.status);
        this.showNotification('보고서 전송에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('❌ 일일 스케줄 보고서 전송 오류:', error);
      this.showNotification('보고서 전송 중 오류가 발생했습니다.', 'error');
    }
  }

  // 수동으로 보고서 전송 (관리자가 요청할 때)
  public async sendManualReport(): Promise<void> {
    await this.sendDailyReport();
  }

  // 현재 변경사항 개수 조회
  public getChangeCount(): number {
    return this.changes.length;
  }

  // 변경사항 초기화
  public clearChanges(): void {
    this.changes = [];
    this.lastReportDate = null;
  }

  // 알림 표시 함수
  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined') return;

    // 기존 알림 제거
    const existingNotification = document.getElementById('schedule-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.id = 'schedule-notification';
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // 5초 후 자동 제거
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}

export const scheduleNotificationManager = ScheduleNotificationManager.getInstance();
