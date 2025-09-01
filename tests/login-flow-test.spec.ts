import { test, expect } from '@playwright/test';

test.describe('로그인 플로우 확인 테스트', () => {
  test('김탁수 계정 로그인 후 이동 경로 확인', async ({ page }) => {
    console.log('🚀 김탁수 계정 로그인 플로우 테스트 시작');
    
    // 1. 로그인 페이지 접근
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 2. 로그인 정보 입력
    await page.fill('input[name="phone"]', '01012345678');
    await page.fill('input[name="password"]', 'password123');
    console.log('📝 로그인 정보 입력 완료');
    
    // 3. 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    console.log('🔘 로그인 버튼 클릭 완료');
    
    // 4. 로그인 후 이동 경로 확인
    try {
      // 10초 동안 페이지 이동 대기
      await page.waitForTimeout(10000);
      
      const currentURL = page.url();
      console.log('🌐 현재 URL:', currentURL);
      
      const pageTitle = await page.title();
      console.log('📌 페이지 제목:', pageTitle);
      
      // 5. 페이지 내용 확인
      const bodyText = await page.locator('body').textContent();
      console.log('📄 페이지 본문 길이:', bodyText?.length || 0);
      
      // 6. 스크린샷 저장
      await page.screenshot({ path: 'tests/screenshots/login-flow-kimtaksu.png' });
      console.log('📸 스크린샷 저장됨');
      
    } catch (error) {
      console.log('❌ 로그인 후 페이지 이동 실패:', error);
      
      // 현재 상태 스크린샷
      await page.screenshot({ path: 'tests/screenshots/login-failed-kimtaksu.png' });
      console.log('📸 실패 상태 스크린샷 저장됨');
    }
    
    console.log('🎉 김탁수 계정 로그인 플로우 테스트 완료!');
  });
});
