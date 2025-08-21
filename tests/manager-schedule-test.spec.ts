import { test, expect } from '@playwright/test';

test('매니저 스케줄 입력 테스트', async ({ page }) => {
  console.log('🔍 매니저 스케줄 입력 테스트 시작');
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 로그인 방법 선택 (핀번호)
  await page.click('text=핀번호');
  console.log('✅ 핀번호 로그인 방법 선택');
  
  // 3. 핀번호 입력 (이은정 매니저 계정)
  await page.fill('input[type="password"]', '1234');
  console.log('✅ 매니저 핀번호 입력: 1234');
  
  // 4. 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 버튼 클릭');
  
  // 5. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 페이지 로딩 완료');
  
  // 6. 근무 스케줄 메뉴 클릭
  await page.click('text=근무 스케줄');
  console.log('✅ 근무 스케줄 메뉴 클릭');
  
  // 7. 스케줄 페이지 로딩 대기
  await page.waitForURL('**/schedules');
  console.log('✅ 스케줄 페이지 로딩 완료');
  
  // 8. 스케줄 추가 버튼 확인
  await expect(page.locator('text=스케줄 추가')).toBeVisible();
  console.log('✅ 스케줄 추가 버튼 확인');
  
  // 9. 스케줄 추가 버튼 클릭
  await page.click('text=스케줄 추가');
  console.log('✅ 스케줄 추가 버튼 클릭');
  
  // 10. 스케줄 추가 페이지 로딩 대기
  await page.waitForURL('**/schedules/add');
  console.log('✅ 스케줄 추가 페이지 로딩 완료');
  
  // 11. 사용자 정보 확인
  await expect(page.locator('text=이은정')).toBeVisible();
  console.log('✅ 사용자 정보 확인');
  
  // 12. 날짜 입력 (내일 날짜)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  await page.fill('input[type="date"]', tomorrowStr);
  console.log('✅ 날짜 입력:', tomorrowStr);
  
  // 13. 시작 시간 입력
  await page.fill('input[type="time"]:first-of-type', '10:00');
  console.log('✅ 시작 시간 입력: 10:00');
  
  // 14. 종료 시간 입력
  await page.fill('input[type="time"]:last-of-type', '18:00');
  console.log('✅ 종료 시간 입력: 18:00');
  
  // 15. 메모 입력
  await page.fill('textarea', '매니저 정상 근무');
  console.log('✅ 메모 입력: 매니저 정상 근무');
  
  // 16. 스케줄 추가 버튼 클릭
  await page.click('text=스케줄 추가');
  console.log('✅ 스케줄 추가 버튼 클릭');
  
  // 17. 성공 메시지 확인
  await expect(page.locator('text=스케줄이 성공적으로 추가되었습니다')).toBeVisible();
  console.log('✅ 성공 메시지 확인');
  
  // 18. 스케줄 페이지로 자동 이동 대기
  await page.waitForURL('**/schedules');
  console.log('✅ 스케줄 페이지로 자동 이동 완료');
  
  // 19. 추가된 스케줄 확인
  await expect(page.locator('text=이은정')).toBeVisible();
  console.log('✅ 추가된 스케줄 확인');
  
  // 20. 스크린샷 캡처
  await page.screenshot({ path: 'manager-schedule-test.png', fullPage: true });
  console.log('✅ 매니저 스케줄 테스트 스크린샷 캡처 완료');
  
  console.log('🎉 매니저 스케줄 입력 테스트 완료!');
});
