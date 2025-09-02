import { test, expect } from '@playwright/test';

test.describe('로그인 디버깅 테스트', () => {
  test('로그인 과정 오류 확인', async ({ page }) => {
    console.log('🚀 로그인 디버깅 테스트 시작');
    
    // 1. 콘솔 오류 수집
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 2. 네트워크 오류 수집
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.url()} - ${response.status()}`);
      }
    });
    
    // 3. 로그인 페이지 접근
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 4. 로그인 정보 입력
    await page.fill('input[name="phone"]', '01012345678');
    await page.fill('input[name="password"]', 'password123');
    console.log('📝 로그인 정보 입력 완료');
    
    // 5. 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    console.log('🔘 로그인 버튼 클릭 완료');
    
    // 6. 로그인 후 상태 확인 (10초 대기)
    await page.waitForTimeout(10000);
    
    const currentURL = page.url();
    console.log('🌐 현재 URL:', currentURL);
    
    const pageTitle = await page.title();
    console.log('📌 페이지 제목:', pageTitle);
    
    // 7. 오류 메시지 확인
    const errorMessages = page.locator('[class*="error"], [class*="alert"], [class*="message"]');
    const errorCount = await errorMessages.count();
    console.log('❌ 오류 메시지 수:', errorCount);
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`❌ 오류 메시지 ${i + 1}:`, errorText?.trim());
      }
    }
    
    // 8. 성공 메시지 확인
    const successMessages = page.locator('[class*="success"], [class*="success"]');
    const successCount = await successMessages.count();
    console.log('✅ 성공 메시지 수:', successCount);
    
    if (successCount > 0) {
      for (let i = 0; i < successCount; i++) {
        const successText = await successMessages.nth(i).textContent();
        console.log(`✅ 성공 메시지 ${i + 1}:`, successText?.trim());
      }
    }
    
    // 9. 콘솔 오류 출력
    console.log('📊 총 콘솔 오류 수:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('콘솔 오류 목록:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 10. 네트워크 오류 출력
    console.log('📊 총 네트워크 오류 수:', networkErrors.length);
    if (networkErrors.length > 0) {
      console.log('네트워크 오류 목록:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 11. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/login-debug.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 로그인 디버깅 테스트 완료!');
  });
});
