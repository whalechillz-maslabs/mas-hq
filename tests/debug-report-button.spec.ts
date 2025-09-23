import { test, expect } from '@playwright/test';

// 보고서 전송 버튼 디버깅 테스트
test('보고서 전송 버튼 디버깅', async ({ page }) => {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://maslabs.kr';
  
  // 1. 로그인
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: '전화번호' }).fill('010-6669-9000');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('66699000');
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 2. 관리자 스케줄 페이지로 이동
  await page.goto(`${base}/admin/employee-schedules`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 3. 직원 선택
  const employeeButton = page.getByRole('button', { name: /MASLABS-\d{3}/i }).first();
  await expect(employeeButton).toBeVisible({ timeout: 10000 });
  await employeeButton.click();
  await page.waitForTimeout(1000);

  // 4. 보고서 전송 버튼 클릭
  const reportButton = page.getByRole('button', { name: /보고서 전송|전송 중/ });
  await expect(reportButton).toBeVisible({ timeout: 10000 });
  
  // 콘솔 로그 수집 시작
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // 네트워크 요청 수집 시작
  const networkRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('schedule-daily-report')) {
      networkRequests.push(`REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('schedule-daily-report')) {
      networkRequests.push(`RESPONSE: ${response.status()} ${response.url()}`);
    }
  });
  
  // 버튼 클릭
  await reportButton.click();
  await page.waitForTimeout(3000);
  
  // 결과 출력
  console.log('=== 콘솔 로그 ===');
  consoleLogs.forEach(log => console.log(log));
  
  console.log('=== 네트워크 요청 ===');
  networkRequests.forEach(req => console.log(req));
  
  // 5. 알림이나 메시지 확인
  const alertMessage = page.locator('.alert, .notification, .toast, [role="alert"]');
  if (await alertMessage.count() > 0) {
    const message = await alertMessage.first().textContent();
    console.log('알림 메시지:', message);
  } else {
    console.log('알림 메시지 없음');
  }
});
