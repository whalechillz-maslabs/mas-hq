import { test, expect } from '@playwright/test';

test.describe('GitHub 직접 로그인 후 Vercel 연결 테스트', () => {
  test('GitHub에 직접 로그인한 후 Vercel 연결하여 MASLABS 앱 테스트', async ({ page }) => {
    console.log('🚀 GitHub 직접 로그인 테스트 시작');
    
    // 1단계: GitHub에 직접 접근하여 로그인
    console.log('🔗 1단계: GitHub에 직접 접근하여 로그인...');
    await page.goto('https://github.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ GitHub 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // GitHub 로그인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/github-direct-login-start.png' });
    console.log('📸 GitHub 로그인 페이지 스크린샷 저장 완료');
    
    // 2단계: GitHub 사용자명 입력
    console.log('👤 2단계: GitHub 사용자명 입력...');
    
    // 사용자명 입력 필드 찾기
    const usernameInput = page.locator('input[name="login"]');
    if (await usernameInput.isVisible()) {
      await usernameInput.fill('whalechillz');
      console.log('👤 GitHub 사용자명 입력 완료: whalechillz');
      
      // 3단계: GitHub 비밀번호 입력
      console.log('🔐 3단계: GitHub 비밀번호 입력...');
      
      // 비밀번호 입력 필드 찾기
      const passwordInput = page.locator('input[name="password"]');
      if (await passwordInput.isVisible()) {
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
          
          // 4단계: GitHub 프로필 페이지 확인
          console.log('👤 4단계: GitHub 프로필 페이지 확인...');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          console.log('✅ GitHub 프로필 페이지 로딩 완료');
          console.log('🔗 현재 URL:', page.url());
          
          // GitHub 프로필 페이지 스크린샷
          await page.screenshot({ path: 'test-results/github-direct-login-profile.png' });
          console.log('📸 GitHub 프로필 페이지 스크린샷 저장 완료');
          
          // 5단계: Vercel로 이동하여 GitHub 계정 연결
          console.log('🔗 5단계: Vercel로 이동하여 GitHub 계정 연결...');
          await page.goto('https://vercel.com/login');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          console.log('✅ Vercel 로그인 페이지 접속 완료');
          console.log('🔗 현재 URL:', page.url());
          
          // Vercel 로그인 페이지 스크린샷
          await page.screenshot({ path: 'test-results/github-direct-login-vercel.png' });
          console.log('📸 Vercel 로그인 페이지 스크린샷 저장 완료');
          
          // 6단계: GitHub 로그인 버튼 클릭
          console.log('🔍 6단계: GitHub 로그인 버튼 클릭...');
          
          const githubButton = page.locator('button:has-text("Continue with GitHub")');
          if (await githubButton.isVisible()) {
            await githubButton.click();
            console.log('🔘 GitHub 로그인 버튼 클릭 완료');
            
            // GitHub OAuth 승인 페이지 대기
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(5000);
            
            console.log('🔐 GitHub OAuth 승인 페이지로 이동됨');
            console.log('🔗 현재 URL:', page.url());
            console.log('📄 현재 페이지 제목:', await page.title());
            
            // OAuth 승인 페이지 스크린샷
            await page.screenshot({ path: 'test-results/github-direct-login-oauth.png' });
            console.log('📸 GitHub OAuth 승인 페이지 스크린샷 저장 완료');
            
            // 7단계: GitHub OAuth 승인
            console.log('✅ 7단계: GitHub OAuth 승인...');
            
            // 승인 버튼 찾기
            const authorizeButton = page.locator('button:has-text("Authorize"), button:has-text("승인"), input[type="submit"]');
            if (await authorizeButton.isVisible()) {
              await authorizeButton.click();
              console.log('🔘 OAuth 승인 버튼 클릭 완료');
              
              // Vercel 대시보드로 리다이렉트 대기
              await page.waitForLoadState('networkidle');
              await page.waitForTimeout(5000);
              
              console.log('✅ GitHub OAuth 승인 완료');
              console.log('🔗 현재 URL:', page.url());
              console.log('📄 현재 페이지 제목:', await page.title());
              
              // 8단계: Vercel 대시보드에서 MASLABS 프로젝트 찾기
              console.log('🔍 8단계: Vercel 대시보드에서 MASLABS 프로젝트 찾기...');
              
              if (page.url().includes('vercel.com/dashboard') || page.url().includes('vercel.com/projects')) {
                console.log('✅ Vercel 대시보드 접근 성공!');
                
                // Vercel 대시보드 스크린샷
                await page.screenshot({ path: 'test-results/github-direct-login-vercel-dashboard.png' });
                console.log('📸 Vercel 대시보드 스크린샷 저장 완료');
                
                // 9단계: MASLABS 프로젝트 찾기
                console.log('🔍 9단계: MASLABS 프로젝트 찾기...');
                
                // 프로젝트 목록에서 MASLABS 찾기
                const maslabsProject = page.locator('text=maslabs, text=MASLABS, text=www.maslabs.kr, text=mas-k4khi7snf');
                if (await maslabsProject.isVisible()) {
                  await maslabsProject.click();
                  console.log('✅ MASLABS 프로젝트 클릭 완료');
                  
                  // 프로젝트 대시보드 로딩 대기
                  await page.waitForLoadState('networkidle');
                  await page.waitForTimeout(3000);
                  
                  console.log('✅ MASLABS 프로젝트 대시보드 접속 완료');
                  console.log('🔗 현재 URL:', page.url());
                  
                  // 프로젝트 대시보드 스크린샷
                  await page.screenshot({ path: 'test-results/github-direct-login-maslabs-project.png' });
                  console.log('📸 MASLABS 프로젝트 대시보드 스크린샷 저장 완료');
                  
                  // 10단계: MASLABS 앱으로 이동
                  console.log('🔗 10단계: MASLABS 앱으로 이동...');
                  await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
                  await page.waitForLoadState('networkidle');
                  await page.waitForTimeout(3000);
                  
                  console.log('✅ MASLABS 앱 접근 완료');
                  console.log('🔗 현재 URL:', page.url());
                  console.log('📄 현재 페이지 제목:', await page.title());
                  
                  // MASLABS 앱 스크린샷
                  await page.screenshot({ path: 'test-results/github-direct-login-maslabs-app.png' });
                  console.log('📸 MASLABS 앱 스크린샷 저장 완료');
                  
                  // 11단계: 스케줄 승인 처리 페이지 접근
                  console.log('🔗 11단계: 스케줄 승인 처리 페이지 접근...');
                  await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/admin/employee-schedules');
                  await page.waitForLoadState('networkidle');
                  await page.waitForTimeout(3000);
                  
                  console.log('✅ 스케줄 승인 처리 페이지 접속 완료');
                  console.log('🔗 현재 URL:', page.url());
                  console.log('📄 현재 페이지 제목:', await page.title());
                  
                  // 승인 처리 페이지 스크린샷
                  await page.screenshot({ path: 'test-results/github-direct-login-approval-page.png' });
                  console.log('📸 스케줄 승인 처리 페이지 스크린샷 저장 완료');
                  
                  // 12단계: 페이지 구조 분석
                  console.log('🔍 12단계: 페이지 구조 분석...');
                  
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
                  
                  // 13단계: 승인 버튼 및 상태 확인
                  console.log('🔍 13단계: 승인 버튼 및 상태 확인...');
                  
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
                  
                  // 14단계: 최종 결과 요약
                  console.log('📊 14단계: 최종 결과 요약');
                  console.log('=====================================');
                  console.log('🎯 GitHub 직접 로그인 테스트 결과:');
                  console.log(`   - GitHub 직접 로그인: ✅ 성공`);
                  console.log(`   - Vercel 연결: ✅ 성공`);
                  console.log(`   - MASLABS 프로젝트 접근: ✅ 성공`);
                  console.log(`   - MASLABS 앱 접근: ✅ 성공`);
                  console.log(`   - 승인 처리 페이지 접근: ✅ 성공`);
                  console.log(`   - 승인 관련 텍스트: ${hasApprovalText ? '✅ 발견' : '❌ 없음'}`);
                  console.log(`   - 스케줄 관련 텍스트: ${hasScheduleText ? '✅ 발견' : '❌ 없음'}`);
                  console.log(`   - 승인 버튼: ${approveButtonCount}개`);
                  console.log(`   - 대기중 상태: ${pendingCount}개`);
                  console.log(`   - 승인됨 상태: ${approvedCount}개`);
                  console.log('=====================================');
                  
                  // 최종 스크린샷
                  await page.screenshot({ path: 'test-results/github-direct-login-final-result.png' });
                  console.log('📸 최종 결과 스크린샷 저장 완료');
                  
                } else {
                  console.log('❌ MASLABS 프로젝트를 찾을 수 없음');
                }
                
              } else {
                console.log('❌ Vercel 대시보드 접근에 실패했습니다');
                console.log('🔗 현재 URL:', page.url());
              }
              
            } else {
              console.log('❌ OAuth 승인 버튼을 찾을 수 없음');
            }
            
          } else {
            console.log('❌ GitHub 로그인 버튼을 찾을 수 없음');
          }
          
        }
        
      } else {
        console.log('❌ 비밀번호 입력 필드를 찾을 수 없음');
      }
      
    } else {
      console.log('❌ 사용자명 입력 필드를 찾을 수 없음');
    }
    
    console.log('🎉 GitHub 직접 로그인 테스트 완료!');
  });
});
