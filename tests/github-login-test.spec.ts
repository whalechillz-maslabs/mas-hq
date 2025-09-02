import { test, expect } from '@playwright/test';

test.describe('GitHub 로그인으로 스케줄 승인 처리 테스트', () => {
  test('GitHub 로그인 후 MASLABS 앱에서 스케줄 승인 처리 확인', async ({ page }) => {
    console.log('🚀 GitHub 로그인 테스트 시작');
    
    // 1단계: Vercel 로그인 페이지로 이동
    console.log('🔗 1단계: Vercel 로그인 페이지로 이동...');
    await page.goto('https://vercel.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Vercel 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // Vercel 로그인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/github-login-vercel-start.png' });
    console.log('📸 Vercel 로그인 페이지 스크린샷 저장 완료');
    
    // 2단계: GitHub 로그인 버튼 찾기 및 클릭
    console.log('🔍 2단계: GitHub 로그인 버튼 찾기...');
    
    // GitHub 로그인 버튼 찾기 (여러 선택자 시도)
    const githubSelectors = [
      'button:has-text("Continue with GitHub")',
      'button:has-text("GitHub")',
      'button[data-provider="github"]',
      'button[aria-label*="GitHub"]',
      'a[href*="github"]'
    ];
    
    let githubButton = null;
    for (const selector of githubSelectors) {
      githubButton = page.locator(selector);
      if (await githubButton.isVisible()) {
        console.log(`✅ GitHub 로그인 버튼 발견: ${selector}`);
        break;
      }
    }
    
    if (githubButton && await githubButton.isVisible()) {
      console.log('✅ GitHub 로그인 버튼 발견');
      
      // GitHub 로그인 버튼 클릭
      await githubButton.click();
      console.log('🔘 GitHub 로그인 버튼 클릭 완료');
      
      // GitHub 로그인 페이지 로딩 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      console.log('🔗 GitHub 로그인 페이지로 이동됨');
      console.log('📄 현재 페이지 제목:', await page.title());
      console.log('🔗 현재 URL:', page.url());
      
      // GitHub 로그인 페이지 스크린샷
      await page.screenshot({ path: 'test-results/github-login-github-page.png' });
      console.log('📸 GitHub 로그인 페이지 스크린샷 저장 완료');
      
      // 3단계: GitHub 사용자명 입력
      console.log('👤 3단계: GitHub 사용자명 입력...');
      
      // 사용자명 입력 필드 찾기
      const usernameSelectors = [
        'input[name="login"]',
        'input[id="login_field"]',
        'input[type="text"]',
        'input[autocomplete="username"]'
      ];
      
      let usernameInput = null;
      for (const selector of usernameSelectors) {
        usernameInput = page.locator(selector);
        if (await usernameInput.isVisible()) {
          console.log(`✅ 사용자명 입력 필드 발견: ${selector}`);
          break;
        }
      }
      
      if (usernameInput && await usernameInput.isVisible()) {
        // GitHub 사용자명 입력 (whalechillz)
        await usernameInput.fill('whalechillz');
        console.log('👤 GitHub 사용자명 입력 완료: whalechillz');
        
        // 4단계: GitHub 비밀번호 입력
        console.log('🔐 4단계: GitHub 비밀번호 입력...');
        
        // 비밀번호 입력 필드 찾기
        const passwordSelectors = [
          'input[name="password"]',
          'input[id="password"]',
          'input[type="password"]'
        ];
        
        let passwordInput = null;
        for (const selector of passwordSelectors) {
          passwordInput = page.locator(selector);
          if (await passwordInput.isVisible()) {
            console.log(`✅ 비밀번호 입력 필드 발견: ${selector}`);
            break;
          }
        }
        
        if (passwordInput && await passwordInput.isVisible()) {
          console.log('🔐 비밀번호 입력 필드 발견');
          console.log('💡 GitHub 비밀번호를 직접 입력해주세요 (30초 대기)');
          
          // 사용자가 비밀번호 입력할 때까지 대기
          await page.waitForTimeout(30000);
          
          // 로그인 후 상태 확인
          const currentUrl = page.url();
          const title = await page.title();
          
          console.log('🔗 로그인 후 URL:', currentUrl);
          console.log('📄 로그인 후 제목:', title);
          
          // 로그인 성공 여부 확인
          if (currentUrl.includes('github.com/login') && title.includes('Sign in')) {
            console.log('❌ 여전히 GitHub 로그인 페이지에 있음');
            console.log('💡 GitHub 로그인에 실패했습니다.');
          } else {
            console.log('✅ GitHub 로그인 성공!');
            
            // 5단계: Vercel 권한 승인 페이지 대기
            console.log('🔐 5단계: Vercel 권한 승인 페이지 대기...');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(5000);
            
            console.log('🔗 Vercel 권한 승인 페이지로 이동됨');
            console.log('📄 현재 페이지 제목:', await page.title());
            
            // 권한 승인 페이지 스크린샷
            await page.screenshot({ path: 'test-results/github-login-vercel-auth.png' });
            console.log('📸 Vercel 권한 승인 페이지 스크린샷 저장 완료');
            
            // 6단계: Vercel 권한 승인
            console.log('✅ 6단계: Vercel 권한 승인...');
            
            // 권한 승인 버튼 찾기
            const authorizeSelectors = [
              'button:has-text("Authorize")',
              'button:has-text("승인")',
              'button[type="submit"]',
              'input[type="submit"]'
            ];
            
            let authorizeButton = null;
            for (const selector of authorizeSelectors) {
              authorizeButton = page.locator(selector);
              if (await authorizeButton.isVisible()) {
                console.log(`✅ 권한 승인 버튼 발견: ${selector}`);
                break;
              }
            }
            
            if (authorizeButton && await authorizeButton.isVisible()) {
              await authorizeButton.click();
              console.log('🔘 권한 승인 버튼 클릭 완료');
              
              // MASLABS 앱으로 리다이렉트 대기
              await page.waitForLoadState('networkidle');
              await page.waitForTimeout(5000);
              
              console.log('✅ Vercel 권한 승인 완료');
              console.log('🔗 현재 URL:', page.url());
              console.log('📄 현재 페이지 제목:', await page.title());
              
              // 7단계: MASLABS 앱 접근 확인
              console.log('🔗 7단계: MASLABS 앱 접근 확인...');
              
              if (page.url().includes('mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app')) {
                console.log('✅ MASLABS 앱 접근 성공!');
                
                // MASLABS 앱 스크린샷
                await page.screenshot({ path: 'test-results/github-login-maslabs-app.png' });
                console.log('📸 MASLABS 앱 스크린샷 저장 완료');
                
                // 8단계: 스케줄 승인 처리 페이지 접근
                console.log('🔗 8단계: 스케줄 승인 처리 페이지 접근...');
                await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/admin/employee-schedules');
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(3000);
                
                console.log('✅ 스케줄 승인 처리 페이지 접속 완료');
                console.log('🔗 현재 URL:', page.url());
                console.log('📄 현재 페이지 제목:', await page.title());
                
                // 승인 처리 페이지 스크린샷
                await page.screenshot({ path: 'test-results/github-login-approval-page.png' });
                console.log('📸 스케줄 승인 처리 페이지 스크린샷 저장 완료');
                
                // 9단계: 페이지 구조 분석
                console.log('🔍 9단계: 페이지 구조 분석...');
                
                // 페이지에 있는 주요 요소들 확인
                const pageContent = await page.content();
                
                // 승인 관련 텍스트가 있는지 확인
                const hasApprovalText = pageContent.includes('승인') || 
                                       pageContent.includes('approve') || 
                                       pageContent.includes('pending') ||
                                       pageContent.includes('approved');
                
                console.log('✅ 승인 관련 텍스트 포함 여부:', hasApprovalText);
                
                // 스케줄 관련 텍스트가 있는지 확인
                const hasScheduleText = pageContent.includes('스케줄') || 
                                       pageContent.includes('schedule') ||
                                       pageContent.includes('근무');
                
                console.log('✅ 스케줄 관련 텍스트 포함 여부:', hasScheduleText);
                
                // 10단계: 승인 버튼 및 상태 확인
                console.log('🔍 10단계: 승인 버튼 및 상태 확인...');
                
                // 승인 버튼 찾기
                const approveButtons = page.locator('button:has-text("승인"), button:has-text("approve"), button:has-text("Approve")');
                const approveButtonCount = await approveButtons.count();
                console.log('✅ 승인 버튼 개수:', approveButtonCount);
                
                // 대기중 상태 확인
                const pendingElements = page.locator('text=대기중, text=pending, text=Pending');
                const pendingCount = await pendingElements.count();
                console.log('✅ 대기중 상태 요소 개수:', pendingCount);
                
                // 승인됨 상태 확인
                const approvedElements = page.locator('text=승인됨, text=approved, text=Approved');
                const approvedCount = await approvedElements.count();
                console.log('✅ 승인됨 상태 요소 개수:', approvedCount);
                
                // 11단계: 최종 결과 요약
                console.log('📊 11단계: 최종 결과 요약');
                console.log('=====================================');
                console.log('🎯 GitHub 로그인 테스트 결과:');
                console.log(`   - GitHub 로그인: ✅ 성공`);
                console.log(`   - Vercel 권한 승인: ✅ 성공`);
                console.log(`   - MASLABS 앱 접근: ✅ 성공`);
                console.log(`   - 승인 처리 페이지 접근: ✅ 성공`);
                console.log(`   - 승인 관련 텍스트: ${hasApprovalText ? '✅ 발견' : '❌ 없음'}`);
                console.log(`   - 스케줄 관련 텍스트: ${hasScheduleText ? '✅ 발견' : '❌ 없음'}`);
                console.log(`   - 승인 버튼: ${approveButtonCount}개`);
                console.log(`   - 대기중 상태: ${pendingCount}개`);
                console.log(`   - 승인됨 상태: ${approvedCount}개`);
                console.log('=====================================');
                
                // 최종 스크린샷
                await page.screenshot({ path: 'test-results/github-login-final-result.png' });
                console.log('📸 최종 결과 스크린샷 저장 완료');
                
              } else {
                console.log('❌ MASLABS 앱 접근에 실패했습니다');
                console.log('🔗 현재 URL:', page.url());
              }
              
            } else {
              console.log('❌ 권한 승인 버튼을 찾을 수 없음');
            }
            
          }
          
        } else {
          console.log('❌ 비밀번호 입력 필드를 찾을 수 없음');
        }
        
      } else {
        console.log('❌ 사용자명 입력 필드를 찾을 수 없음');
      }
      
    } else {
      console.log('❌ GitHub 로그인 버튼을 찾을 수 없음');
      console.log('💡 Vercel 로그인 페이지에서 GitHub 옵션이 보이지 않습니다');
    }
    
    console.log('🎉 GitHub 로그인 테스트 완료!');
  });
});
