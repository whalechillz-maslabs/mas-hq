import { test, expect } from '@playwright/test';

// 관리자 스케줄 페이지에서 직원 선택 후 "보고서 전송" 버튼이 보이는지 확인
test('보고서 전송 버튼 표시', async ({ page }) => {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://maslabs.kr';
  
  // 1. 로그인 페이지로 이동
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  
  // 2. 관리자 로그인 (김탁수)
  await page.getByRole('textbox', { name: '전화번호' }).fill('010-6669-9000');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('66699000');
  await page.getByRole('button', { name: '로그인' }).click();
  
  // 3. 로그인 완료 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 4. 관리자 스케줄 페이지로 이동
  await page.goto(`${base}/admin/employee-schedules`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 5. 직원 목록에서 첫 직원 선택
  const employeeButton = page.getByRole('button', { name: /MASLABS-\d{3}/i }).first();
  await expect(employeeButton).toBeVisible({ timeout: 10000 });
  await employeeButton.click();
  await page.waitForTimeout(1000);

  // 6. 보고서 전송 버튼 확인
  const reportButton = page.getByRole('button', { name: /보고서 전송|전송 중/ });
  await expect(reportButton).toBeVisible({ timeout: 10000 });
});


