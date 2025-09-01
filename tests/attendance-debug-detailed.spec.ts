import { test, expect } from '@playwright/test';

test.describe('개인별 출근 관리 페이지 상세 디버깅 테스트', () => {
  test('김탁수 계정으로 개인 출근 관리 디버깅', async ({ page }) => {
    console.log('🚀 개인별 출근 관리 페이지 상세 디버깅 테스트 시작');
    
    // 1. 콘솔 오류 수집
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      } else if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // 2. 네트워크 요청/응답 수집
    const networkRequests: string[] = [];
    const networkResponses: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      
      if (status >= 400) {
        networkErrors.push(`${url} - ${status}`);
      } else {
        networkResponses.push(`${url} - ${status}`);
      }
    });
    
    // 3. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 4. 개인 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    console.log('🔍 개인 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // 5. 페이지 상태 확인
    const pageTitle = await page.locator('h1, [class*="title"]').first().textContent();
    console.log('📌 페이지 제목:', pageTitle);
    
    // 6. 로딩 상태 확인
    const loadingElement = page.locator('text=로딩 중...');
    const hasLoading = await loadingElement.count() > 0;
    console.log('🔄 로딩 상태:', hasLoading ? '로딩 중' : '로딩 완료');
    
    if (hasLoading) {
      console.log('⚠️ 페이지가 로딩 중입니다. 추가 10초 대기...');
      await page.waitForTimeout(10000);
      
      // 로딩 후 다시 확인
      const stillLoading = await loadingElement.count() > 0;
      console.log('🔄 추가 대기 후 로딩 상태:', stillLoading ? '여전히 로딩 중' : '로딩 완료');
    }
    
    // 7. 페이지 내용 상세 분석
    const bodyText = await page.locator('body').textContent();
    console.log('📄 페이지 본문 길이:', bodyText?.length || 0);
    
    // 8. 특정 요소들 확인
    const scheduleElements = page.locator('[class*="schedule"], [class*="Schedule"]');
    const scheduleCount = await scheduleElements.count();
    console.log('📅 스케줄 관련 요소 수:', scheduleCount);
    
    const buttonElements = page.locator('button');
    const buttonCount = await buttonElements.count();
    console.log('🔘 총 버튼 수:', buttonCount);
    
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const buttonText = await buttonElements.nth(i).textContent();
        const buttonClass = await buttonElements.nth(i).getAttribute('class');
        console.log(`🔘 버튼 ${i + 1}:`, buttonText?.trim(), '클래스:', buttonClass);
      }
    }
    
    // 9. 콘솔 정보 출력
    console.log('📊 총 콘솔 오류 수:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('콘솔 오류 목록:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('📊 총 콘솔 경고 수:', consoleWarnings.length);
    if (consoleWarnings.length > 0) {
      console.log('콘솔 경고 목록:');
      consoleWarnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }
    
    console.log('📊 총 콘솔 로그 수:', consoleLogs.length);
    if (consoleLogs.length > 0) {
      console.log('콘솔 로그 목록 (최근 10개):');
      consoleLogs.slice(-10).forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    }
    
    // 10. 네트워크 정보 출력
    console.log('📊 총 네트워크 요청 수:', networkRequests.length);
    console.log('📊 총 네트워크 응답 수:', networkResponses.length);
    console.log('📊 총 네트워크 오류 수:', networkErrors.length);
    
    if (networkErrors.length > 0) {
      console.log('네트워크 오류 목록:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 11. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-debug-detailed.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 개인별 출근 관리 페이지 상세 디버깅 테스트 완료!');
  });
});
