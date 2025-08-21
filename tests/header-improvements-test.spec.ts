import { test, expect } from '@playwright/test';

test('상단바 개선사항 확인 테스트', async ({ page }) => {
  console.log('🔍 상단바 개선사항 확인 테스트 시작');
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 로그인 방법 선택 (전화번호)
  await page.click('text=전화번호');
  console.log('✅ 전화번호 로그인 방법 선택');
  
  // 3. 전화번호 입력 (관리자 계정)
  await page.fill('input[type="tel"]', '010-6669-9000');
  console.log('✅ 관리자 전화번호 입력: 010-6669-9000');
  
  // 4. 비밀번호 입력
  await page.fill('input[type="password"]', '66699000');
  console.log('✅ 관리자 비밀번호 입력: 66699000');
  
  // 5. 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 버튼 클릭');
  
  // 6. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 페이지 로딩 완료');
  
  // 7. 페이지 로딩 대기
  await page.waitForTimeout(3000);
  
  // 8. 데스크톱 환경에서 상단바 확인
  await page.setViewportSize({ width: 1200, height: 800 });
  console.log('🖥️ 데스크톱 환경 설정');
  
  // 9. 데스크톱에서 날짜/시간이 중앙에 표시되는지 확인
  const desktopTimeElement = await page.locator('.hidden.md\\:block .text-sm.text-gray-600').first();
  await expect(desktopTimeElement).toBeVisible();
  console.log('✅ 데스크톱에서 날짜/시간 중앙 표시 확인');
  
  // 10. 모바일 환경으로 변경
  await page.setViewportSize({ width: 375, height: 667 });
  console.log('📱 모바일 환경 설정');
  
  // 11. 모바일에서 날짜/시간이 상단바 아래에 표시되는지 확인
  const mobileTimeElement = await page.locator('.md\\:hidden .text-sm.text-gray-600').first();
  await expect(mobileTimeElement).toBeVisible();
  console.log('✅ 모바일에서 날짜/시간 하단 표시 확인');
  
  // 12. 모바일 메뉴 버튼 확인
  const mobileMenuButton = await page.locator('button[title="메뉴"]');
  await expect(mobileMenuButton).toBeVisible();
  console.log('✅ 모바일 메뉴 버튼 확인');
  
  // 13. 모바일 메뉴 클릭
  await mobileMenuButton.click();
  console.log('✅ 모바일 메뉴 클릭');
  
  // 14. 모바일 메뉴 드롭다운 확인
  await expect(page.locator('text=프로필 설정')).toBeVisible();
  await expect(page.locator('text=알림 설정')).toBeVisible();
  await expect(page.locator('text=로그아웃')).toBeVisible();
  console.log('✅ 모바일 메뉴 드롭다운 확인');
  
  // 15. 알림 뱃지 확인 (알림이 있을 때)
  const notificationButton = await page.locator('button:has([data-testid="bell-icon"])').first();
  const hasNotificationBadge = await notificationButton.locator('.bg-red-500').count() > 0;
  console.log('🔔 알림 뱃지 존재:', hasNotificationBadge);
  
  // 16. 사용자 이름 truncate 확인
  const userNameElement = await page.locator('.truncate').first();
  const userNameText = await userNameElement.textContent();
  console.log('👤 사용자 이름:', userNameText);
  
  // 17. 스크린샷 캡처 (데스크톱)
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.screenshot({ path: 'header-desktop-test.png', fullPage: false });
  console.log('✅ 데스크톱 상단바 스크린샷 캡처');
  
  // 18. 스크린샷 캡처 (모바일)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'header-mobile-test.png', fullPage: false });
  console.log('✅ 모바일 상단바 스크린샷 캡처');
  
  console.log('🎉 상단바 개선사항 확인 테스트 완료!');
});
