import { test, expect } from '@playwright/test';

test.describe('Nightly 브라우저로 GitHub 로그인 테스트', () => {
  test('Nightly 브라우저에서 GitHub 로그인 시도', async ({ page }) => {
    console.log('🌙 Nightly 브라우저로 GitHub 로그인 테스트 시작');
    
    // Nightly 브라우저 특화 설정
    await page.addInitScript(() => {
      // 자동화 감지 완화
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // 플러그인 정보 수정
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // 언어 설정
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ko-KR', 'ko', 'en-US', 'en'],
      });
      
      // 사용자 에이전트 수정 (Nightly 버전으로)
      Object.defineProperty(navigator, 'userAgent', {
        get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
    });
    
    console.log('✅ Nightly 브라우저 설정 완료');
    
    // 1단계: Vercel 로그인 페이지로 이동
    console.log('🔗 1단계: Vercel 로그인 페이지로 이동...');
    await page.goto('https://vercel.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Vercel 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // Vercel 로그인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/nightly-vercel-page.png' });
    console.log('📸 Vercel 로그인 페이지 스크린샷 저장 완료');
    
    // 2단계: GitHub 로그인 버튼 클릭
    console.log('🔍 2단계: GitHub 로그인 버튼 클릭...');
    
    const githubButton = page.locator('button:has-text("Continue with GitHub")');
    
    if (await githubButton.isVisible()) {
      console.log('✅ GitHub 로그인 버튼 발견');
      console.log('🖱️ GitHub 로그인 버튼 클릭...');
      
      await githubButton.click();
      console.log('✅ GitHub 로그인 버튼 클릭 완료');
      
      // GitHub OAuth 페이지 로딩 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      console.log('🔗 GitHub OAuth 페이지 로딩 완료');
      console.log('🔗 현재 URL:', page.url());
      console.log('📄 페이지 제목:', await page.title());
      
      // GitHub OAuth 페이지 스크린샷
      await page.screenshot({ path: 'test-results/nightly-github-oauth.png' });
      console.log('📸 GitHub OAuth 페이지 스크린샷 저장 완료');
      
      // 3단계: GitHub 로그인 폼 확인
      console.log('🔍 3단계: GitHub 로그인 폼 확인...');
      
      // GitHub 로그인 폼 요소 찾기
      const usernameInput = page.locator('input[name="login"], input[id="login_field"]');
      const passwordInput = page.locator('input[name="password"], input[id="password"]');
      
      if (await usernameInput.isVisible()) {
        console.log('✅ GitHub 사용자명 입력 필드 발견');
        await usernameInput.fill('whalechillz');
        console.log('✅ 사용자명 자동 입력 완료: whalechillz');
        
        if (await passwordInput.isVisible()) {
          console.log('✅ GitHub 비밀번호 입력 필드 발견');
          console.log('🔐 비밀번호 입력이 필요합니다');
          
          // 4단계: 사용자에게 로그인 완료 대기 안내
          console.log('⏳ 4단계: 사용자에게 로그인 완료 대기 안내...');
          console.log('=====================================');
          console.log('🎯 Nightly 브라우저에서 GitHub 로그인:');
          console.log('   1. 비밀번호 필드에 비밀번호 입력');
          console.log('   2. "Sign in" 버튼 클릭');
          console.log('   3. 2단계 인증이 있다면 완료');
          console.log('   4. Vercel로 리다이렉트 대기');
          console.log('=====================================');
          console.log('⏰ 3분간 대기합니다...');
          console.log('💡 이 시간 동안 GitHub 로그인을 완료해주세요!');
          
          // 3분 대기 (180초)
          await page.waitForTimeout(180000);
          
          console.log('✅ 3분 대기 완료!');
          console.log('🔗 현재 URL:', page.url());
          console.log('📄 현재 페이지 제목:', await page.title());
          
          // 5단계: 로그인 후 상태 확인
          console.log('🔍 5단계: 로그인 후 상태 확인...');
          
          const currentUrl = page.url();
          const isOnVercel = currentUrl.includes('vercel.com');
          const isOnGitHub = currentUrl.includes('github.com');
          
          console.log('📊 Nightly 브라우저 로그인 결과:');
          console.log(`   - Vercel 페이지: ${isOnVercel ? '✅ 예' : '❌ 아니오'}`);
          console.log(`   - GitHub 페이지: ${isOnGitHub ? '✅ 예' : '❌ 아니오'}`);
          console.log(`   - 현재 URL: ${currentUrl}`);
          
          if (isOnVercel) {
            console.log('🎉 Nightly 브라우저로 GitHub 로그인 성공!');
            console.log('🚀 이제 MASLABS 앱에 접근할 수 있습니다');
          } else if (isOnGitHub) {
            console.log('⚠️ 여전히 GitHub 페이지에 있음');
            console.log('💡 로그인이 완료되지 않았거나 2단계 인증이 필요할 수 있습니다');
          }
          
        } else {
          console.log('❌ GitHub 비밀번호 입력 필드를 찾을 수 없음');
        }
        
      } else {
        console.log('❌ GitHub 사용자명 입력 필드를 찾을 수 없음');
      }
      
    } else {
      console.log('❌ GitHub 로그인 버튼을 찾을 수 없음');
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/nightly-final-result.png' });
    console.log('📸 최종 결과 스크린샷 저장 완료');
    
    console.log('🎉 Nightly 브라우저 GitHub 로그인 테스트 완료!');
  });
});
