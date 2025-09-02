import { test, expect } from '@playwright/test';

test.describe('GitHub 로그인 실행 테스트', () => {
  test('GitHub 로그인으로 Vercel 연결 및 MASLABS 앱 접근', async ({ page }) => {
    console.log('🚀 GitHub 로그인 실행 테스트 시작');
    
    const baseUrl = 'https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app';
    
    // 1단계: Vercel 로그인 페이지로 이동
    console.log('🔗 1단계: Vercel 로그인 페이지로 이동...');
    await page.goto('https://vercel.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Vercel 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // Vercel 로그인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/github-login-vercel-page.png' });
    console.log('📸 Vercel 로그인 페이지 스크린샷 저장 완료');
    
    // 2단계: GitHub 로그인 버튼 찾기 및 클릭
    console.log('🔍 2단계: GitHub 로그인 버튼 찾기 및 클릭...');
    
    // GitHub 로그인 버튼 찾기 (여러 선택자 시도)
    const githubButton = page.locator('button:has-text("Continue with GitHub"), button:has-text("GitHub"), button:has-text("Sign in with GitHub")');
    
    if (await githubButton.isVisible()) {
      console.log('✅ GitHub 로그인 버튼 발견');
      console.log('🖱️ GitHub 로그인 버튼 클릭...');
      
      // GitHub 로그인 버튼 클릭
      await githubButton.click();
      console.log('✅ GitHub 로그인 버튼 클릭 완료');
      
      // GitHub 로그인 페이지로 리다이렉트 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      console.log('🔗 GitHub 로그인 페이지로 이동 완료');
      console.log('🔗 현재 URL:', page.url());
      console.log('📄 페이지 제목:', await page.title());
      
      // GitHub 로그인 페이지 스크린샷
      await page.screenshot({ path: 'test-results/github-login-github-page.png' });
      console.log('📸 GitHub 로그인 페이지 스크린샷 저장 완료');
      
      // 3단계: GitHub 로그인 폼 확인
      console.log('🔍 3단계: GitHub 로그인 폼 확인...');
      
      // GitHub 로그인 폼 요소 확인
      const usernameInput = page.locator('input[name="login"], input[id="login_field"]');
      const passwordInput = page.locator('input[name="password"], input[id="password"]');
      const signInButton = page.locator('input[name="commit"][value="Sign in"], button:has-text("Sign in")');
      
      if (await usernameInput.isVisible()) {
        console.log('✅ GitHub 사용자명 입력 필드 발견');
        
        // 사용자명 자동 입력
        await usernameInput.fill('whalechillz');
        console.log('✅ 사용자명 자동 입력 완료: whalechillz');
        
        // 비밀번호 입력 필드 확인
        if (await passwordInput.isVisible()) {
          console.log('✅ GitHub 비밀번호 입력 필드 발견');
          console.log('🔐 비밀번호 입력이 필요합니다');
          console.log('💡 이제 비밀번호를 직접 입력해주세요');
          
          // 로그인 버튼 확인
          if (await signInButton.isVisible()) {
            console.log('✅ GitHub 로그인 버튼 발견');
            console.log('🚀 로그인 준비 완료!');
          } else {
            console.log('❌ GitHub 로그인 버튼을 찾을 수 없음');
          }
          
        } else {
          console.log('❌ GitHub 비밀번호 입력 필드를 찾을 수 없음');
        }
        
      } else {
        console.log('❌ GitHub 사용자명 입력 필드를 찾을 수 없음');
      }
      
      // 4단계: 사용자에게 로그인 완료 대기 안내
      console.log('⏳ 4단계: 사용자에게 로그인 완료 대기 안내...');
      console.log('=====================================');
      console.log('🎯 GitHub 로그인 안내:');
      console.log('   1. 비밀번호 필드에 비밀번호 입력');
      console.log('   2. "Sign in" 버튼 클릭');
      console.log('   3. 2단계 인증이 있다면 완료');
      console.log('   4. Vercel로 리다이렉트 대기');
      console.log('=====================================');
      console.log('⏰ 2분간 대기합니다...');
      console.log('💡 이 시간 동안 GitHub 로그인을 완료해주세요!');
      
      // 2분 대기 (120초)
      await page.waitForTimeout(120000);
      
      console.log('✅ 2분 대기 완료!');
      console.log('🔗 현재 URL:', page.url());
      console.log('📄 현재 페이지 제목:', await page.title());
      
      // 5단계: 로그인 후 상태 확인
      console.log('🔍 5단계: 로그인 후 상태 확인...');
      
      const currentUrl = page.url();
      const currentTitle = await page.title();
      
      // GitHub에서 Vercel로 리다이렉트되었는지 확인
      const isRedirectedToVercel = currentUrl.includes('vercel.com') || currentUrl.includes('vercel.app');
      const isStillOnGitHub = currentUrl.includes('github.com');
      
      console.log('📊 리다이렉트 상태 분석:');
      console.log(`   - Vercel로 리다이렉트: ${isRedirectedToVercel ? '✅ 예' : '❌ 아니오'}`);
      console.log(`   - GitHub에 머물러 있음: ${isStillOnGitHub ? '✅ 예' : '❌ 아니오'}`);
      console.log(`   - 현재 URL: ${currentUrl}`);
      console.log(`   - 현재 제목: ${currentTitle}`);
      
      // 6단계: Vercel로 리다이렉트된 경우 MASLABS 앱 접근 시도
      if (isRedirectedToVercel) {
        console.log('🚀 6단계: Vercel로 리다이렉트됨 - MASLABS 앱 접근 시도...');
        
        // Vercel 대시보드에서 MASLABS 프로젝트 찾기
        console.log('🔍 MASLABS 프로젝트 찾는 중...');
        
        // MASLABS 앱으로 직접 이동 시도
        await page.goto(baseUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);
        
        console.log('✅ MASLABS 앱 접근 시도 완료');
        console.log('🔗 현재 URL:', page.url());
        console.log('📄 페이지 제목:', await page.title());
        
        // MASLABS 앱 접근 성공 여부 확인
        const isOnMaslabsApp = page.url().includes('mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
        const isStillOnVercel = page.url().includes('vercel.com');
        
        console.log('📊 MASLABS 앱 접근 결과:');
        console.log(`   - MASLABS 앱 접근: ${isOnMaslabsApp ? '✅ 성공' : '❌ 실패'}`);
        console.log(`   - Vercel에 머물러 있음: ${isStillOnVercel ? '✅ 예' : '❌ 아니오'}`);
        
        if (isOnMaslabsApp) {
          console.log('🎉 MASLABS 앱 접근 성공!');
          
          // 스케줄 추가 페이지 접근 시도 (날짜 문제 해결 확인)
          console.log('🔗 스케줄 추가 페이지 접근 시도...');
          await page.goto(`${baseUrl}/schedules/add`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          console.log('✅ 스케줄 추가 페이지 접근 완료');
          console.log('🔗 현재 URL:', page.url());
          console.log('📄 페이지 제목:', await page.title());
          
          // 날짜 필드 확인
          const dateField = page.locator('input[type="date"], input[name="scheduleDate"]');
          if (await dateField.isVisible()) {
            const currentDate = await dateField.inputValue();
            const today = new Date().toISOString().split('T')[0];
            
            console.log('📅 날짜 필드 확인:');
            console.log(`   - 현재 설정된 날짜: ${currentDate}`);
            console.log(`   - 오늘 날짜: ${today}`);
            console.log(`   - 날짜 일치: ${currentDate === today ? '✅ 예' : '❌ 아니오'}`);
            
            if (currentDate !== today) {
              console.log('⚠️ 날짜 문제 발견: 하드코딩된 날짜가 아직 수정되지 않음');
            } else {
              console.log('✅ 날짜 문제 해결됨: 현재 날짜가 올바르게 표시됨');
            }
          } else {
            console.log('❌ 날짜 필드를 찾을 수 없음');
          }
          
          // 최종 스크린샷
          await page.screenshot({ path: 'test-results/github-login-maslabs-success.png' });
          console.log('📸 MASLABS 앱 접근 성공 스크린샷 저장 완료');
          
        } else {
          console.log('❌ MASLABS 앱 접근 실패');
          console.log('💡 Vercel 대시보드에서 MASLABS 프로젝트를 찾아야 할 수 있습니다');
          
          // 최종 스크린샷
          await page.screenshot({ path: 'test-results/github-login-maslabs-failed.png' });
          console.log('📸 MASLABS 앱 접근 실패 스크린샷 저장 완료');
        }
        
      } else if (isStillOnGitHub) {
        console.log('❌ GitHub에서 Vercel로 리다이렉트되지 않음');
        console.log('💡 GitHub 로그인이 완료되지 않았거나 2단계 인증이 필요할 수 있습니다');
        
        // 최종 스크린샷
        await page.screenshot({ path: 'test-results/github-login-redirect-failed.png' });
        console.log('📸 GitHub 리다이렉트 실패 스크린샷 저장 완료');
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
      await page.screenshot({ path: 'test-results/github-login-button-not-found.png' });
      console.log('📸 GitHub 로그인 버튼 없음 스크린샷 저장 완료');
    }
    
    // 7단계: 최종 결과 요약
    console.log('📊 7단계: 최종 결과 요약');
    console.log('=====================================');
    console.log('🎯 GitHub 로그인 실행 테스트 결과:');
    console.log(`   - Vercel 로그인 페이지 접근: ✅ 성공`);
    console.log(`   - GitHub 로그인 버튼 발견: ${await githubButton.isVisible() ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - GitHub 로그인 페이지 이동: ${page.url().includes('github.com') ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   - Vercel 리다이렉트: ${page.url().includes('vercel.com') ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   - MASLABS 앱 접근: ${page.url().includes('mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app') ? '✅ 성공' : '❌ 실패'}`);
    console.log('=====================================');
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/github-login-final-result.png' });
    console.log('📸 최종 결과 스크린샷 저장 완료');
    
    console.log('🎉 GitHub 로그인 실행 테스트 완료!');
  });
});
