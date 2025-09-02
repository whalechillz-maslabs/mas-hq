import { test, expect } from '@playwright/test';

test.describe('보안 브라우저 설정으로 Google 로그인 테스트', () => {
  test('Google 보안 정책 우회 시도', async ({ page }) => {
    console.log('🚀 보안 브라우저 설정으로 테스트 시작');
    
    // 브라우저를 더 일반적인 것으로 보이게 설정
    await page.addInitScript(() => {
      // Playwright 관련 속성 제거
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // 자동화 관련 속성 숨기기
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Chrome 관련 속성 설정
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en'],
      });
    });
    
    // Vercel 로그인 페이지로 이동
    await page.goto('https://vercel.com/login');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Vercel 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/secure-browser-login-start.png' });
    console.log('📸 로그인 페이지 스크린샷 저장 완료');
    
    // Google 로그인 버튼 찾기 및 클릭
    console.log('🔍 Google 로그인 버튼 찾는 중...');
    const googleButton = page.locator('button:has-text("Continue with Google")');
    
    if (await googleButton.isVisible()) {
      console.log('✅ Google 로그인 버튼 발견');
      
      // Google 로그인 버튼 클릭
      await googleButton.click();
      console.log('🔘 Google 로그인 버튼 클릭 완료');
      
      // Google 로그인 페이지 로딩 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log('🔗 Google 로그인 페이지로 이동됨');
      console.log('📄 현재 페이지 제목:', await page.title());
      
      // Google 로그인 페이지 스크린샷
      await page.screenshot({ path: 'test-results/google-login-page.png' });
      console.log('📸 Google 로그인 페이지 스크린샷 저장 완료');
      
      // 이메일 입력 필드 찾기
      const emailInput = page.locator('input[type="email"], input[name="identifier"]');
      if (await emailInput.isVisible()) {
        console.log('✅ 이메일 입력 필드 발견');
        
        // 이메일 입력
        await emailInput.fill('whalechillz@gmail.com');
        console.log('📧 이메일 입력 완료: whalechillz@gmail.com');
        
        // 다음 버튼 클릭
        const nextButton = page.locator('button:has-text("Next"), button[type="submit"]');
        if (await nextButton.isVisible()) {
          await nextButton.click();
          console.log('🔘 다음 버튼 클릭 완료');
          
          // 비밀번호 입력 페이지 대기
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          // 비밀번호 입력 필드 찾기
          const passwordInput = page.locator('input[type="password"], input[name="password"]');
          if (await passwordInput.isVisible()) {
            console.log('✅ 비밀번호 입력 필드 발견');
            
            // 비밀번호 입력 (사용자가 직접 입력하도록 안내)
            console.log('🔐 비밀번호 입력이 필요합니다. 직접 입력해주세요.');
            console.log('⏳ 비밀번호 입력 완료까지 대기 중... (30초)');
            
            await page.waitForTimeout(30000); // 30초 대기
            
            // 로그인 후 상태 확인
            const currentUrl = page.url();
            const title = await page.title();
            
            console.log('🔗 로그인 후 URL:', currentUrl);
            console.log('📄 로그인 후 제목:', title);
            
            // 최종 스크린샷
            await page.screenshot({ path: 'test-results/after-google-login.png' });
            console.log('📸 로그인 후 상태 스크린샷 저장 완료');
            
          } else {
            console.log('❌ 비밀번호 입력 필드를 찾을 수 없음');
          }
        } else {
          console.log('❌ 다음 버튼을 찾을 수 없음');
        }
      } else {
        console.log('❌ 이메일 입력 필드를 찾을 수 없음');
      }
      
    } else {
      console.log('❌ Google 로그인 버튼을 찾을 수 없음');
    }
    
    console.log('🎉 보안 브라우저 설정 테스트 완료');
  });
});
