import { test, expect } from '@playwright/test';

test.describe('로그인 문제 진단 테스트', () => {
  test('로그인 실패 원인 파악', async ({ page }) => {
    console.log('🚀 로그인 문제 진단 테스트 시작');
    
    // 1. 콘솔 오류 수집
    const consoleErrors: string[] = [];
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // 2. 네트워크 요청 모니터링
    const networkRequests: string[] = [];
    const networkResponses: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('supabase')) {
        networkRequests.push(`REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase')) {
        networkResponses.push(`RESPONSE: ${response.status()} ${response.url()}`);
      }
    });
    
    // 3. 로그인 페이지 접근
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 4. 로그인 시도
    console.log('🔍 로그인 시도 중...');
    
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    // 5. 로그인 결과 확인
    await page.waitForTimeout(5000);
    
    const currentURL = page.url();
    console.log('🌐 로그인 후 현재 URL:', currentURL);
    
    // 6. localStorage 상태 확인
    const localStorageInfo = await page.evaluate(() => {
      return {
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        currentEmployee: localStorage.getItem('currentEmployee') ? 'exists' : 'null'
      };
    });
    
    console.log('📦 LocalStorage 상태:');
    console.log('   - isLoggedIn:', localStorageInfo.isLoggedIn);
    console.log('   - currentEmployee:', localStorageInfo.currentEmployee);
    
    // 7. 오류 진단 결과
    console.log('\n📊 로그인 문제 진단 결과:');
    console.log('='.repeat(50));
    
    console.log(`🔥 콘솔 오류: ${consoleErrors.length}개`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log(`\n📝 콘솔 로그: ${consoleLogs.length}개`);
    if (consoleLogs.length > 0) {
      consoleLogs.slice(-10).forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    }
    
    console.log(`\n🌐 네트워크 요청: ${networkRequests.length}개`);
    if (networkRequests.length > 0) {
      networkRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req}`);
      });
    }
    
    console.log(`\n🌐 네트워크 응답: ${networkResponses.length}개`);
    if (networkResponses.length > 0) {
      networkResponses.forEach((res, index) => {
        console.log(`${index + 1}. ${res}`);
      });
    }
    
    // 8. 결과 분석
    console.log('\n📊 로그인 결과 분석:');
    
    if (currentURL.includes('/quick-task')) {
      console.log('✅ 로그인 성공: 퀵 태스크 페이지로 이동됨');
    } else if (currentURL.includes('/login')) {
      console.log('❌ 로그인 실패: 로그인 페이지에 머물러 있음');
      
      // 오류 메시지 확인
      const errorElement = page.locator('[class*="error"], [class*="Error"], .bg-red-50');
      if (await errorElement.count() > 0) {
        const errorText = await errorElement.textContent();
        console.log('❌ 오류 메시지:', errorText);
      }
    } else {
      console.log('⚠️ 예상치 못한 페이지로 이동:', currentURL);
    }
    
    // 9. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/login-problem-test.png' });
    console.log('\n📸 로그인 문제 진단 스크린샷 저장됨');
    
    console.log('\n🎉 로그인 문제 진단 테스트 완료!');
  });
});
