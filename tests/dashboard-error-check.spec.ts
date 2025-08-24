import { test, expect } from '@playwright/test';

test('대시보드 에러 확인 테스트', async ({ page }) => {
  console.log('🔍 대시보드 에러 확인 테스트 시작');
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 로그인
  await page.click('text=전화번호');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', '66699000');
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 완료');
  
  // 3. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 페이지 로딩 완료');
  
  // 4. 페이지 로딩 대기
  await page.waitForTimeout(5000);
  
  // 5. 대시보드 콘텐츠 확인
  const dashboardContent = await page.textContent('body');
  console.log('📄 대시보드 내용 (처음 1000자):', dashboardContent?.substring(0, 1000));
  
  // 6. KPI 데이터 확인
  const kpiElements = await page.locator('[class*="text-2xl"]').allTextContents();
  console.log('📊 KPI 요소들:', kpiElements);
  
  // 7. 메뉴 버튼들 확인
  const menuButtons = await page.locator('button').allTextContents();
  console.log('🔘 메뉴 버튼들:', menuButtons);
  
  // 8. 콘솔 에러 확인
  const consoleErrors = await page.evaluate(() => {
    return (window as any).consoleErrors || [];
  });
  console.log('🚨 콘솔 에러:', consoleErrors);
  
  // 9. 네트워크 요청 확인
  const networkRequests = await page.evaluate(() => {
    return (window as any).networkRequests || [];
  });
  console.log('🌐 네트워크 요청:', networkRequests);
  
  // 10. 로딩 상태 확인
  const loadingElements = await page.locator('.animate-spin').count();
  console.log('⏳ 로딩 요소 개수:', loadingElements);
  
  // 11. 에러 메시지 확인
  const errorMessages = await page.locator('[class*="error"], [class*="Error"], [class*="red"]').allTextContents();
  console.log('❌ 에러 메시지들:', errorMessages);
  
  // 12. 스크린샷 캡처
  await page.screenshot({ path: 'dashboard-error-check.png', fullPage: true });
  console.log('✅ 대시보드 에러 확인 테스트 스크린샷 캡처 완료');
  
  console.log('🎉 대시보드 에러 확인 테스트 완료!');
});
