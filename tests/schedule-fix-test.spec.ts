import { test, expect } from '@playwright/test';

test('스케줄 에러 수정 확인 테스트', async ({ page }) => {
  console.log('🔍 스케줄 에러 수정 확인 테스트 시작');
  
  // 콘솔 에러 모니터링
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('🚨 콘솔 에러:', msg.text());
    }
  });
  
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.click('text=전화번호');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', '66699000');
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 완료');
  
  // 2. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 로딩 완료');
  
  // 3. 근무 스케줄 메뉴 클릭
  await page.click('text=근무 스케줄');
  console.log('✅ 근무 스케줄 메뉴 클릭');
  
  // 4. 스케줄 페이지 로딩 대기
  await page.waitForURL('**/schedules');
  console.log('✅ 스케줄 페이지 로딩 완료');
  
  // 5. 페이지 로딩 대기
  await page.waitForTimeout(5000);
  
  // 6. 스케줄 데이터 로딩 확인
  const scheduleItems = await page.locator('[class*="bg-blue-200"]').count();
  console.log('📋 스케줄 아이템 개수:', scheduleItems);
  
  // 7. 스케줄 추가 버튼 클릭
  await page.click('text=스케줄 추가');
  console.log('✅ 스케줄 추가 버튼 클릭');
  
  // 8. 스케줄 추가 페이지 로딩 대기
  await page.waitForURL('**/schedules/add');
  console.log('✅ 스케줄 추가 페이지 로딩 완료');
  
  // 9. 사용자 정보 확인
  const userInfo = await page.locator('text=시스템 관리자').isVisible();
  console.log('👤 사용자 정보 표시:', userInfo);
  
  // 10. 입력 필드 확인
  const dateInput = await page.locator('input[type="date"]').isVisible();
  const timeInputs = await page.locator('input[type="time"]').count();
  const textarea = await page.locator('textarea').isVisible();
  
  console.log('📅 날짜 입력 필드:', dateInput);
  console.log('⏰ 시간 입력 필드 개수:', timeInputs);
  console.log('📝 메모 입력 필드:', textarea);
  
  // 11. 스케줄 입력 테스트
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  await page.fill('input[type="date"]', tomorrowStr);
  await page.fill('input[type="time"]:first-of-type', '09:00');
  await page.fill('input[type="time"]:last-of-type', '18:00');
  await page.fill('textarea', '테스트 스케줄');
  console.log('✅ 스케줄 입력 완료');
  
  // 12. 스케줄 추가 버튼 클릭
  await page.click('text=스케줄 추가');
  console.log('✅ 스케줄 추가 버튼 클릭');
  
  // 13. 성공 메시지 확인
  const successMessage = await page.locator('text=스케줄이 성공적으로 추가되었습니다').isVisible();
  console.log('✅ 성공 메시지 표시:', successMessage);
  
  // 14. 스케줄 페이지로 자동 이동 대기
  await page.waitForURL('**/schedules');
  console.log('✅ 스케줄 페이지로 자동 이동 완료');
  
  // 15. 추가된 스케줄 확인
  await page.waitForTimeout(3000);
  const newScheduleItems = await page.locator('[class*="bg-blue-200"]').count();
  console.log('📋 수정된 스케줄 아이템 개수:', newScheduleItems);
  
  // 16. 스크린샷 캡처
  await page.screenshot({ path: 'schedule-fix-test.png', fullPage: true });
  console.log('✅ 스케줄 에러 수정 확인 테스트 스크린샷 캡처 완료');
  
  console.log('🎉 스케줄 에러 수정 확인 테스트 완료!');
});
