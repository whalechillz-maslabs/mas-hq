import { test, expect } from '@playwright/test';

test('스케줄 API 에러 확인 테스트', async ({ page }) => {
  console.log('🔍 스케줄 API 에러 확인 테스트 시작');
  
  // 네트워크 요청 모니터링
  const networkRequests: any[] = [];
  page.on('request', request => {
    if (request.url().includes('schedules')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('schedules')) {
      console.log('🌐 스케줄 API 응답:', {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      
      if (!response.ok()) {
        response.text().then(text => {
          console.log('🚨 에러 응답 내용:', text);
        });
      }
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
  
  // 5. 네트워크 요청 대기
  await page.waitForTimeout(3000);
  
  // 6. 네트워크 요청 분석
  console.log('📊 스케줄 관련 네트워크 요청:', networkRequests);
  
  // 7. 페이지 콘텐츠 확인
  const pageContent = await page.textContent('body');
  console.log('📄 페이지 내용 (스케줄 관련):', pageContent?.includes('스케줄') ? '스케줄 텍스트 발견' : '스케줄 텍스트 없음');
  
  // 8. 로딩 상태 확인
  const loadingElement = await page.locator('text=스케줄을 불러오는 중').count();
  console.log('⏳ 로딩 상태:', loadingElement > 0 ? '로딩 중' : '로딩 완료');
  
  // 9. 에러 메시지 확인
  const errorElements = await page.locator('text=오류').count();
  console.log('🚨 에러 메시지 개수:', errorElements);
  
  // 10. 스크린샷 캡처
  await page.screenshot({ path: 'schedule-api-error-check.png', fullPage: true });
  console.log('✅ 스케줄 API 에러 확인 스크린샷 캡처 완료');
  
  console.log('🎉 스케줄 API 에러 확인 테스트 완료!');
});
