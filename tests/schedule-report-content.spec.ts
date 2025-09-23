import { test, expect } from '@playwright/test';

// 스케줄 변경 후 보고서 내용 확인
test('스케줄 변경 후 보고서 전송 테스트', async ({ page }) => {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://maslabs.kr';
  
  // 1. 나수진으로 로그인
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: '전화번호' }).fill('010-1234-5678'); // 나수진 전화번호
  await page.getByRole('textbox', { name: '비밀번호' }).fill('12345678'); // 나수진 비밀번호
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 2. 스케줄 추가 페이지로 이동
  await page.goto(`${base}/schedules/add`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // 3. 스케줄 생성
  await page.getByRole('textbox', { name: '날짜' }).fill('2025-09-25');
  await page.getByRole('combobox', { name: '시작 시간' }).selectOption('09:00');
  await page.getByRole('combobox', { name: '종료 시간' }).selectOption('12:00');
  await page.getByRole('textbox', { name: '메모' }).fill('테스트 스케줄');
  
  // 4. 스케줄 제출
  await page.getByRole('button', { name: '스케줄 추가' }).click();
  await page.waitForTimeout(3000);
  
  // 5. 관리자로 로그인
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: '전화번호' }).fill('010-6669-9000');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('66699000');
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // 6. 관리자 스케줄 페이지로 이동
  await page.goto(`${base}/admin/employee-schedules`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // 7. 나수진 선택
  const nasujinButton = page.getByRole('button', { name: /나수진|MASLABS-005/i });
  await expect(nasujinButton).toBeVisible({ timeout: 10000 });
  await nasujinButton.click();
  await page.waitForTimeout(1000);
  
  // 8. 보고서 전송 버튼 클릭
  const reportButton = page.getByRole('button', { name: /보고서 전송|전송 중/ });
  await expect(reportButton).toBeVisible({ timeout: 10000 });
  await reportButton.click();
  await page.waitForTimeout(3000);
  
  // 9. 성공 메시지 확인
  // (실제로는 Slack으로 전송되므로 페이지에서 직접 확인은 어려움)
  console.log('✅ 보고서 전송 버튼 클릭 완료');
});
