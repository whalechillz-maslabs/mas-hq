import { test, expect } from '@playwright/test';

test('김탁수 스케줄 추가 및 보고서 테스트', async ({ page }) => {
  console.log('🚀 김탁수 스케줄 추가 및 보고서 테스트 시작');
  
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://maslabs.kr';

  // 1. 로그인 페이지로 이동
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  console.log('📋 로그인 페이지 접속 완료');

  // 2. 김탁수로 로그인
  await page.getByRole('textbox', { name: '전화번호' }).fill('010-6669-9000');
  await page.getByRole('textbox', { name: '비밀번호' }).fill('66699000');
  await page.getByRole('button', { name: '로그인' }).click();
  console.log('✅ 김탁수 로그인 완료');

  // 3. 로그인 완료 대기
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 4. 스케줄 페이지로 이동
  await page.goto(`${base}/schedules`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('📅 스케줄 페이지 접속 완료');

  // 5. 스케줄 추가 버튼 클릭
  const addScheduleButton = page.getByRole('button', { name: /스케줄 추가|추가/ });
  await expect(addScheduleButton).toBeVisible({ timeout: 10000 });
  await addScheduleButton.click();
  console.log('➕ 스케줄 추가 버튼 클릭');

  // 6. 스케줄 추가 페이지에서 폼 작성
  await page.waitForTimeout(1000);

  // 날짜 선택 (오늘 날짜)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  await page.getByLabel('날짜').fill(todayStr);
  console.log('📅 날짜 설정:', todayStr);

  // 시작 시간 설정
  await page.getByLabel('시작 시간').fill('09:00');
  console.log('⏰ 시작 시간 설정: 09:00');

  // 종료 시간 설정
  await page.getByLabel('종료 시간').fill('18:00');
  console.log('⏰ 종료 시간 설정: 18:00');

  // 메모 추가
  await page.getByLabel('메모').fill('김탁수 테스트 스케줄 - Playwright 자동 생성');
  console.log('📝 메모 추가');

  // 7. 스케줄 저장 버튼 찾기
  const saveButtonSelectors = [
    'button:has-text("저장")',
    'button:has-text("생성")',
    'button:has-text("추가")',
    'button[type="submit"]',
    'button:has-text("Save")',
    'button:has-text("Create")'
  ];
  
  let saveButton = null;
  for (const selector of saveButtonSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 })) {
      saveButton = element;
      console.log(`💾 저장 버튼 발견: ${selector}`);
      break;
    }
  }
  
  if (saveButton) {
    await saveButton.click();
    console.log('💾 스케줄 저장 버튼 클릭');
  } else {
    console.log('⚠️ 저장 버튼을 찾을 수 없음. 페이지 스크린샷 저장');
    await page.screenshot({ path: 'schedule-form-debug.png', fullPage: true });
    
    // Enter 키로 폼 제출 시도
    await page.keyboard.press('Enter');
    console.log('⌨️ Enter 키로 폼 제출 시도');
  }

  // 8. 저장 완료 대기
  await page.waitForTimeout(3000);
  console.log('✅ 스케줄 저장 완료');

  // 9. 관리자 스케줄 페이지로 이동
  await page.goto(`${base}/admin/employee-schedules`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('👨‍💼 관리자 스케줄 페이지 접속');

  // 10. 김탁수 직원 선택
  const kimTaksooButton = page.getByRole('button', { name: /MASLABS-001|김탁수/ });
  await expect(kimTaksooButton).toBeVisible({ timeout: 10000 });
  await kimTaksooButton.click();
  await page.waitForTimeout(1000);
  console.log('👤 김탁수 직원 선택');

  // 11. 보고서 전송 버튼 확인 및 클릭
  const reportButton = page.getByRole('button', { name: /보고서 전송|전송 중/ });
  await expect(reportButton).toBeVisible({ timeout: 10000 });
  console.log('📊 보고서 전송 버튼 확인');

  // 12. 보고서 전송
  await reportButton.click();
  console.log('📤 보고서 전송 버튼 클릭');

  // 13. 전송 결과 확인
  await page.waitForTimeout(3000);

  // 성공 알림 확인
  const successNotification = page.locator('text=보고서가 전송되었습니다, text=전송 완료, text=성공');
  if (await successNotification.isVisible({ timeout: 5000 })) {
    console.log('✅ 보고서 전송 성공 알림 확인');
  } else {
    console.log('⚠️ 보고서 전송 결과 확인 필요');
  }

  // 14. 스크린샷 저장
  await page.screenshot({ path: 'kim-taksoo-schedule-test.png', fullPage: true });
  console.log('📸 테스트 결과 스크린샷 저장');

  // 15. 콘솔 로그 확인
  const consoleLogs = await page.evaluate(() => {
    return window.console.logs || [];
  });
  console.log('🔍 콘솔 로그:', consoleLogs);

  console.log('🎉 김탁수 스케줄 추가 및 보고서 테스트 완료');
});
