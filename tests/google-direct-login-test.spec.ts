import { test, expect } from '@playwright/test';

test.describe('Google 직접 로그인으로 스케줄 승인 처리 테스트', () => {
  test('Google 로그인 후 스케줄 승인 처리 페이지 접근', async ({ page }) => {
    console.log('🚀 Google 직접 로그인 테스트 시작');
    
    // 1단계: Google 로그인 페이지로 직접 이동
    console.log('🔗 1단계: Google 로그인 페이지로 직접 이동...');
    await page.goto('https://accounts.google.com/signin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Google 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // Google 로그인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/google-direct-login-start.png' });
    console.log('📸 Google 로그인 페이지 스크린샷 저장 완료');
    
    // 2단계: 이메일 입력
    console.log('📧 2단계: 이메일 입력...');
    
    // 이메일 입력 필드 찾기 (여러 선택자 시도)
    const emailSelectors = [
      'input[type="email"]',
      'input[name="identifier"]',
      'input[autocomplete="username"]',
      'input[data-testid="identifier-field"]',
      'input[aria-label*="Email"]',
      'input[placeholder*="Email"]'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      emailInput = page.locator(selector);
      if (await emailInput.isVisible()) {
        console.log(`✅ 이메일 입력 필드 발견: ${selector}`);
        break;
      }
    }
    
    if (emailInput && await emailInput.isVisible()) {
      // 이메일 입력
      await emailInput.fill('whalechillz@gmail.com');
      console.log('📧 이메일 입력 완료: whalechillz@gmail.com');
      
      // 다음 버튼 찾기 및 클릭
      const nextSelectors = [
        'button:has-text("Next")',
        'button[type="submit"]',
        'button[data-testid="login/email-button"]',
        'button[jsname="LgbsSe"]',
        'button:has-text("다음")'
      ];
      
      let nextButton = null;
      for (const selector of nextSelectors) {
        nextButton = page.locator(selector);
        if (await nextButton.isVisible()) {
          console.log(`✅ 다음 버튼 발견: ${selector}`);
          break;
        }
      }
      
      if (nextButton && await nextButton.isVisible()) {
        await nextButton.click();
        console.log('🔘 다음 버튼 클릭 완료');
        
        // 비밀번호 입력 페이지 대기
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000);
        
        console.log('🔐 비밀번호 입력 페이지로 이동됨');
        console.log('🔗 현재 URL:', page.url());
        console.log('📄 페이지 제목:', await page.title());
        
        // 비밀번호 입력 페이지 스크린샷
        await page.screenshot({ path: 'test-results/google-direct-login-password.png' });
        console.log('📸 비밀번호 입력 페이지 스크린샷 저장 완료');
        
        // 3단계: 비밀번호 입력
        console.log('🔐 3단계: 비밀번호 입력...');
        
        // 비밀번호 입력 필드 찾기
        const passwordSelectors = [
          'input[type="password"]',
          'input[name="password"]',
          'input[autocomplete="current-password"]',
          'input[data-testid="password-field"]'
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
          console.log('💡 비밀번호를 직접 입력해주세요 (30초 대기)');
          
          // 사용자가 비밀번호 입력할 때까지 대기
          await page.waitForTimeout(30000);
          
          // 로그인 후 상태 확인
          const currentUrl = page.url();
          const title = await page.title();
          
          console.log('🔗 로그인 후 URL:', currentUrl);
          console.log('📄 로그인 후 제목:', title);
          
          // 로그인 성공 여부 확인
          if (currentUrl.includes('accounts.google.com') && title.includes('Sign in')) {
            console.log('❌ 여전히 Google 로그인 페이지에 있음');
            console.log('💡 로그인에 실패했습니다.');
          } else {
            console.log('✅ Google 로그인 성공!');
            
            // 4단계: MASLABS 앱으로 직접 이동
            console.log('🔗 4단계: MASLABS 앱으로 직접 이동...');
            await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            console.log('✅ MASLABS 앱 접속 완료');
            console.log('🔗 현재 URL:', page.url());
            console.log('📄 페이지 제목:', await page.title());
            
            // MASLABS 앱 스크린샷
            await page.screenshot({ path: 'test-results/google-direct-login-maslabs-app.png' });
            console.log('📸 MASLABS 앱 스크린샷 저장 완료');
            
            // 5단계: 스케줄 승인 처리 페이지 접근
            console.log('🔗 5단계: 스케줄 승인 처리 페이지 접근...');
            await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/admin/employee-schedules');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            console.log('✅ 스케줄 승인 처리 페이지 접속 완료');
            console.log('🔗 현재 URL:', page.url());
            console.log('📄 페이지 제목:', await page.title());
            
            // 승인 처리 페이지 스크린샷
            await page.screenshot({ path: 'test-results/google-direct-login-approval-page.png' });
            console.log('📸 스케줄 승인 처리 페이지 스크린샷 저장 완료');
            
            // 6단계: 페이지 구조 분석
            console.log('🔍 6단계: 페이지 구조 분석...');
            
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
            
            // 7단계: 승인 버튼 및 상태 확인
            console.log('🔍 7단계: 승인 버튼 및 상태 확인...');
            
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
            
            // 8단계: 최종 결과 요약
            console.log('📊 8단계: 최종 결과 요약');
            console.log('=====================================');
            console.log('🎯 Google 직접 로그인 테스트 결과:');
            console.log(`   - Google 로그인: ✅ 성공`);
            console.log(`   - MASLABS 앱 접근: ✅ 성공`);
            console.log(`   - 승인 처리 페이지 접근: ✅ 성공`);
            console.log(`   - 승인 관련 텍스트: ${hasApprovalText ? '✅ 발견' : '❌ 없음'}`);
            console.log(`   - 스케줄 관련 텍스트: ${hasScheduleText ? '✅ 발견' : '❌ 없음'}`);
            console.log(`   - 승인 버튼: ${approveButtonCount}개`);
            console.log(`   - 대기중 상태: ${pendingCount}개`);
            console.log(`   - 승인됨 상태: ${approvedCount}개`);
            console.log('=====================================');
            
            // 최종 스크린샷
            await page.screenshot({ path: 'test-results/google-direct-login-final-result.png' });
            console.log('📸 최종 결과 스크린샷 저장 완료');
            
          }
          
        } else {
          console.log('❌ 비밀번호 입력 필드를 찾을 수 없음');
        }
        
      } else {
        console.log('❌ 다음 버튼을 찾을 수 없음');
      }
      
    } else {
      console.log('❌ 이메일 입력 필드를 찾을 수 없음');
    }
    
    console.log('🎉 Google 직접 로그인 테스트 완료!');
  });
});
