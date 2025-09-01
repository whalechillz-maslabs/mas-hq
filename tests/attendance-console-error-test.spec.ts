import { test, expect } from '@playwright/test';

test.describe('출근 관리 페이지 콘솔 오류 확인 테스트', () => {
  test('콘솔 오류 및 네트워크 요청 확인', async ({ page }) => {
    console.log('🚀 출근 관리 페이지 콘솔 오류 확인 테스트 시작');
    
    // 콘솔 오류 수집
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ 콘솔 오류:', msg.text());
      }
    });
    
    // 네트워크 오류 수집
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        const url = response.url();
        const status = response.status();
        networkErrors.push(`${url} - ${status}`);
        console.log(`❌ 네트워크 오류: ${url} - ${status}`);
      }
    });
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 김탁수 계정으로 로그인 (관리자)
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 빠른 업무 입력 페이지로 이동
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 출근 관리 페이지로 이동
    console.log('🔍 출근 관리 페이지로 이동 중...');
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    console.log('✅ 출근 관리 페이지 접근');
    
    // 3. 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 4. 콘솔 오류 확인
    console.log(`📊 총 콘솔 오류 수: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('콘솔 오류 목록:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 5. 네트워크 오류 확인
    console.log(`📊 총 네트워크 오류 수: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      console.log('네트워크 오류 목록:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 6. 페이지 제목 확인
    const pageTitle = page.locator('h1');
    const titleText = await pageTitle.textContent();
    console.log('📌 페이지 제목:', titleText);
    
    // 7. 페이지 내용 확인
    const pageContent = await page.content();
    console.log('📄 페이지 HTML 길이:', pageContent.length);
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-console-error-test.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 콘솔 오류 확인 테스트 완료!');
  });
});
