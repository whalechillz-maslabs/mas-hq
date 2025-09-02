import { test, expect } from '@playwright/test';

test.describe('GitHub 자동 로그인 테스트', () => {
  test('GitHub 자동 로그인으로 Vercel 연결 시도', async ({ page }) => {
    console.log('🚀 GitHub 자동 로그인 테스트 시작');
    
    // 변수 스코프 문제 해결을 위한 선언
    let usernameInput: any;
    let passwordInput: any;
    let signInButton: any;
    
    // 1단계: Vercel 로그인 페이지로 이동
    console.log('🔗 1단계: Vercel 로그인 페이지로 이동...');
    await page.goto('https://vercel.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Vercel 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // Vercel 로그인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/vercel-login-page.png' });
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
      await page.screenshot({ path: 'test-results/github-oauth-page.png' });
      console.log('📸 GitHub OAuth 페이지 스크린샷 저장 완료');
      
      // 3단계: GitHub 로그인 폼 자동 입력 시도
      console.log('🔍 3단계: GitHub 로그인 폼 자동 입력 시도...');
      
      // GitHub 로그인 폼 요소 찾기
      usernameInput = page.locator('input[name="login"], input[id="login_field"]');
      passwordInput = page.locator('input[name="password"], input[id="password"]');
      signInButton = page.locator('input[name="commit"][value="Sign in"], button:has-text("Sign in")');
      
      if (await usernameInput.isVisible()) {
        console.log('✅ GitHub 사용자명 입력 필드 발견');
        
        // 사용자명 자동 입력
        await usernameInput.fill('whalechillz');
        console.log('✅ 사용자명 자동 입력 완료: whalechillz');
        
        if (await passwordInput.isVisible()) {
          console.log('✅ GitHub 비밀번호 입력 필드 발견');
          
          // 비밀번호 자동 입력 시도
          try {
            await passwordInput.fill('Zoo100MAS!!');
            console.log('✅ 비밀번호 자동 입력 완료');
            
            // 로그인 버튼 확인 및 클릭
            if (await signInButton.isVisible()) {
              console.log('✅ GitHub 로그인 버튼 발견');
              console.log('🖱️ 로그인 버튼 클릭...');
              
              await signInButton.click();
              console.log('✅ 로그인 버튼 클릭 완료');
              
              // 로그인 처리 대기
              await page.waitForLoadState('networkidle');
              await page.waitForTimeout(10000);
              
              console.log('🔗 로그인 처리 완료 대기');
              console.log('🔗 현재 URL:', page.url());
              console.log('📄 현재 페이지 제목:', await page.title());
              
              // 로그인 후 상태 확인
              const currentUrl = page.url();
              const isOnVercel = currentUrl.includes('vercel.com');
              const isOnGitHub = currentUrl.includes('github.com');
              const isOnMaslabs = currentUrl.includes('mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
              
              console.log('📊 자동 로그인 결과 분석:');
              console.log(`   - Vercel 페이지: ${isOnVercel ? '✅ 예' : '❌ 아니오'}`);
              console.log(`   - GitHub 페이지: ${isOnGitHub ? '✅ 예' : '❌ 아니오'}`);
              console.log(`   - MASLABS 앱: ${isOnMaslabs ? '✅ 예' : '❌ 아니오'}`);
              console.log(`   - 현재 URL: ${currentUrl}`);
              
              if (isOnMaslabs) {
                console.log('🎉 자동 로그인 성공! MASLABS 앱에 접근됨');
                
                // 스케줄 추가 페이지 접근 시도
                console.log('🔗 스케줄 추가 페이지 접근 시도...');
                await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(5000);
                
                console.log('✅ 스케줄 추가 페이지 접근 완료');
                console.log('🔗 현재 URL:', page.url());
                console.log('📄 페이지 제목:', await page.title());
                
                // 스케줄 추가 페이지 스크린샷
                await page.screenshot({ path: 'test-results/schedule-add-page-success.png' });
                console.log('📸 스케줄 추가 페이지 스크린샷 저장 완료');
                
                // 승인 상태 확인
                const scheduleContent = await page.content();
                const hasApproved = scheduleContent.includes('승인됨') || scheduleContent.includes('approved');
                const hasPending = scheduleContent.includes('대기중') || scheduleContent.includes('pending');
                
                console.log('📊 스케줄 승인 상태:');
                console.log(`   - 승인됨: ${hasApproved ? '✅ 발견' : '❌ 없음'}`);
                console.log(`   - 대기중: ${hasPending ? '✅ 발견' : '❌ 없음'}`);
                
              } else if (isOnVercel) {
                console.log('⚠️ Vercel 페이지에 머물러 있음');
                console.log('💡 2단계 인증이나 추가 인증이 필요할 수 있습니다');
                
                // 최종 스크린샷
                await page.screenshot({ path: 'test-results/vercel-still-on-page.png' });
                console.log('📸 Vercel 페이지 머물러 있음 스크린샷 저장 완료');
                
              } else if (isOnGitHub) {
                console.log('⚠️ GitHub 페이지에 머물러 있음');
                console.log('💡 로그인 실패 또는 2단계 인증 필요');
                
                // 최종 스크린샷
                await page.screenshot({ path: 'test-results/github-still-on-page.png' });
                console.log('📸 GitHub 페이지 머물러 있음 스크린샷 저장 완료');
              }
              
            } else {
              console.log('❌ GitHub 로그인 버튼을 찾을 수 없음');
            }
            
          } catch (error) {
            console.log('❌ 비밀번호 자동 입력 실패:', error);
            console.log('💡 수동으로 비밀번호를 입력해야 할 수 있습니다');
            
            // 최종 스크린샷
            await page.screenshot({ path: 'test-results/password-input-failed.png' });
            console.log('📸 비밀번호 입력 실패 스크린샷 저장 완료');
          }
          
        } else {
          console.log('❌ GitHub 비밀번호 입력 필드를 찾을 수 없음');
        }
        
      } else {
        console.log('❌ GitHub 사용자명 입력 필드를 찾을 수 없음');
      }
      
    } else {
      console.log('❌ GitHub 로그인 버튼을 찾을 수 없음');
      console.log('💡 Vercel 로그인 페이지 구조가 변경되었을 수 있습니다');
      
      // 페이지 구조 분석
      const pageContent = await page.content();
      console.log('📊 페이지 내용 분석:');
      console.log(`   - 페이지 크기: ${pageContent.length} 문자`);
      console.log(`   - GitHub 관련 텍스트: ${pageContent.includes('GitHub') ? '✅ 있음' : '❌ 없음'}`);
      console.log(`   - Google 관련 텍스트: ${pageContent.includes('Google') ? '✅ 있음' : '❌ 없음'}`);
      
      // 최종 스크린샷
      await page.screenshot({ path: 'test-results/github-button-not-found.png' });
      console.log('📸 GitHub 버튼 없음 스크린샷 저장 완료');
    }
    
    // 4단계: 최종 결과 요약
    console.log('📊 4단계: 최종 결과 요약');
    console.log('=====================================');
    console.log('🎯 GitHub 자동 로그인 테스트 결과:');
    console.log(`   - Vercel 로그인 페이지 접근: ✅ 성공`);
    console.log(`   - GitHub 로그인 버튼 발견: ${await githubButton.isVisible() ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 사용자명 자동 입력: ${usernameInput && await usernameInput.isVisible() ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   - 비밀번호 자동 입력: ${passwordInput && await passwordInput.isVisible() ? '✅ 시도' : '❌ 실패'}`);
    console.log(`   - 로그인 버튼 클릭: ${signInButton && await signInButton.isVisible() ? '✅ 시도' : '❌ 실패'}`);
    console.log('=====================================');
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/auto-login-final-result.png' });
    console.log('📸 최종 결과 스크린샷 저장 완료');
    
    console.log('🎉 GitHub 자동 로그인 테스트 완료!');
  });
});
