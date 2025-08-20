import { test, expect } from '@playwright/test';

test('대시보드 디버깅 테스트', async ({ page }) => {
  console.log('🔍 대시보드 디버깅 테스트 시작');
  
  // 1. 대시보드 페이지로 직접 이동
  await page.goto('http://localhost:3000/dashboard');
  console.log('✅ 대시보드 페이지 직접 접속');
  
  // 2. 페이지 URL 확인
  console.log('📍 현재 URL:', page.url());
  
  // 3. 페이지 로딩 대기
  await page.waitForTimeout(5000);
  
  // 4. 페이지 내용 확인
  const pageContent = await page.textContent('body');
  console.log('📄 페이지 내용 (처음 1000자):', pageContent?.substring(0, 1000));
  
  // 5. 로딩 상태 확인
  const loadingElements = await page.locator('[class*="loading"], [class*="Loading"]').allTextContents();
  console.log('⏳ 로딩 요소들:', loadingElements);
  
  // 6. 에러 메시지 확인
  const errorElements = await page.locator('[class*="error"], [class*="Error"]').allTextContents();
  console.log('❌ 에러 요소들:', errorElements);
  
  // 7. 콘솔 로그 확인
  page.on('console', msg => {
    console.log('🔍 브라우저 콘솔:', msg.text());
  });
  
  // 8. 네트워크 요청 확인
  page.on('request', request => {
    console.log('🌐 요청:', request.url());
  });
  
  page.on('response', response => {
    console.log('📡 응답:', response.url(), response.status());
  });
  
  // 9. 스크린샷 캡처
  await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
  console.log('✅ 디버그 스크린샷 캡처 완료');
  
  console.log('🎉 대시보드 디버깅 테스트 완료!');
});
