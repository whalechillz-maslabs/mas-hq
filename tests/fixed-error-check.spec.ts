import { test, expect } from '@playwright/test';

test('수정된 에러 확인 테스트', async ({ page }) => {
  console.log('🔍 수정된 에러 확인 테스트 시작');
  
  // 콘솔 에러 수집
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🚨 콘솔 에러:', msg.text());
    }
  });
  
  // 네트워크 에러 수집
  page.on('response', response => {
    if (!response.ok()) {
      console.log('🌐 네트워크 에러:', response.url(), response.status(), response.statusText());
    }
  });
  
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.click('text=전화번호');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 2. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 로그인 완료');
  
  // 3. 근무 스케줄 메뉴 클릭
  await page.click('text=근무 스케줄');
  console.log('✅ 근무 스케줄 메뉴 클릭');
  
  // 4. 스케줄 페이지 로딩 대기
  await page.waitForURL('**/schedules');
  console.log('✅ 스케줄 페이지 로딩 완료');
  
  // 5. 페이지 로딩 대기
  await page.waitForTimeout(3000);
  
  // 6. 스케줄 추가 버튼 확인
  await expect(page.locator('text=스케줄 추가')).toBeVisible();
  console.log('✅ 스케줄 추가 버튼 확인');
  
  // 7. 스케줄 추가 버튼 클릭
  await page.click('text=스케줄 추가');
  console.log('✅ 스케줄 추가 버튼 클릭');
  
  // 8. 스케줄 추가 페이지 로딩 대기
  await page.waitForURL('**/schedules/add');
  console.log('✅ 스케줄 추가 페이지 로딩 완료');
  
  // 9. 사용자 정보 확인
  await expect(page.locator('text=시스템 관리자')).toBeVisible();
  console.log('✅ 사용자 정보 확인');
  
  // 10. 날짜 입력 (내일 날짜)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  await page.fill('input[type="date"]', tomorrowStr);
  console.log('✅ 날짜 입력:', tomorrowStr);
  
  // 11. 시간 입력
  await page.fill('input[type="time"]:first-of-type', '10:00');
  await page.fill('input[type="time"]:last-of-type', '18:00');
  console.log('✅ 시간 입력 완료');
  
  // 12. 메모 입력
  await page.fill('textarea', '관리자 정상 근무');
  console.log('✅ 메모 입력 완료');
  
  // 13. 스케줄 추가 버튼 클릭
  await page.click('text=스케줄 추가');
  console.log('✅ 스케줄 추가 버튼 클릭');
  
  // 14. 성공 메시지 확인
  await expect(page.locator('text=스케줄이 성공적으로 추가되었습니다')).toBeVisible();
  console.log('✅ 성공 메시지 확인');
  
  // 15. 스케줄 페이지로 자동 이동 대기
  await page.waitForURL('**/schedules');
  console.log('✅ 스케줄 페이지로 자동 이동 완료');
  
  // 16. 추가된 스케줄 확인
  await expect(page.locator('text=시스템 관리자')).toBeVisible();
  console.log('✅ 추가된 스케줄 확인');
  
  // 17. 스크린샷 캡처
  await page.screenshot({ path: 'fixed-error-check.png', fullPage: true });
  console.log('✅ 수정된 에러 확인 스크린샷 캡처 완료');
  
  console.log('🎉 수정된 에러 확인 테스트 완료!');
});
