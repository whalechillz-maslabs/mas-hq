import { test, expect } from '@playwright/test';

test.describe('개인별 출근 관리 페이지 오류 진단', () => {
  test('콘솔 오류 및 네트워크 오류 확인', async ({ page }) => {
    console.log('🚀 개인별 출근 관리 페이지 오류 진단 시작');
    
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
    
    // 2. 네트워크 오류 수집
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.url()} - ${response.status()}`);
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
    console.log('�� 개인 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(10000);
    
    console.log('\n📊 오류 진단 결과:');
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
    
    console.log(`\n�� 네트워크 오류: ${networkErrors.length}개`);
    if (networkErrors.length > 0) {
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 5. 추가 정보 - localStorage 확인
    const localStorageInfo = await page.evaluate(() => {
      return {
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        currentEmployee: localStorage.getItem('currentEmployee') ? 'exists' : 'null'
      };
    });
    
    console.log('\n📦 LocalStorage 상태:');
    console.log('   - isLoggedIn:', localStorageInfo.isLoggedIn);
    console.log('   - currentEmployee:', localStorageInfo.currentEmployee);
    
    // 6. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-error-test.png' });
    console.log('\n📸 오류 진단 스크린샷 저장됨');
    
    console.log('\n🎉 개인별 출근 관리 페이지 오류 진단 완료!');
  });
});
