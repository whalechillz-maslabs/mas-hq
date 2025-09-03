import { test, expect } from '@playwright/test';

test('브라우저에서 직접 출근 관리 페이지 확인', async ({ page }) => {
  // 출근 관리 페이지로 이동
  await page.goto('https://www.maslabs.kr/attendance');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 더 오래 기다리기
  await page.waitForTimeout(15000);
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'attendance-page-full.png', fullPage: true });
  
  // 콘솔 로그 확인
  const consoleMessages = await page.evaluate(() => {
    return window.console.logs || [];
  });
  console.log('콘솔 메시지:', consoleMessages);
  
  // 네트워크 요청 확인
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource').map(r => r.name);
  });
  console.log('네트워크 요청:', networkRequests.slice(0, 10));
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('페이지 제목:', title);
  
  // URL 확인
  const url = page.url();
  console.log('현재 URL:', url);
  
  // 페이지가 로그인 페이지인지 확인
  const isLoginPage = await page.locator('text=로그인').count() > 0;
  console.log('로그인 페이지인가?', isLoginPage);
  
  // 로그인 폼이 있는지 확인
  const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').count() > 0;
  console.log('로그인 폼이 있는가?', hasLoginForm);
  
  // 에러 메시지가 있는지 확인
  const hasError = await page.locator('text=error, text=Error, text=에러').count() > 0;
  console.log('에러 메시지가 있는가?', hasError);
  
  // 로딩 상태 확인
  const hasLoading = await page.locator('text=로딩, text=Loading, text=loading').count() > 0;
  console.log('로딩 상태가 있는가?', hasLoading);
  
  // 페이지 내용이 비어있는지 확인
  const bodyText = await page.locator('body').textContent();
  const isEmpty = !bodyText || bodyText.length < 100;
  console.log('페이지가 비어있는가?', isEmpty);
  console.log('페이지 텍스트 길이:', bodyText?.length || 0);
  
  // React 앱이 로드되었는지 확인
  const hasReact = await page.locator('[data-reactroot], [data-nextjs-data]').count() > 0;
  console.log('React 앱이 로드되었는가?', hasReact);
  
  // Next.js 관련 요소 확인
  const hasNextJS = await page.locator('[data-nextjs-router-state-tree]').count() > 0;
  console.log('Next.js 요소가 있는가?', hasNextJS);
  
  console.log('=== 브라우저 확인 완료 ===');
});
