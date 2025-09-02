import { test, expect } from '@playwright/test';

test.describe('MASLABS 스케줄 추가 페이지 테스트', () => {
  test('Chromium Nightly로 스케줄 추가 페이지 접근 및 승인 상태 확인', async ({ page }) => {
    console.log('🌙 Chromium Nightly로 MASLABS 스케줄 테스트 시작');
    
    const baseUrl = 'https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app';
    
    // 1단계: 메인 페이지 접근
    console.log('🔗 1단계: MASLABS 메인 페이지 접근...');
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 메인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 메인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/maslabs-main-page.png' });
    console.log('📸 메인 페이지 스크린샷 저장 완료');
    
    // 2단계: 페이지 상태 분석
    console.log('🔍 2단계: 페이지 상태 분석...');
    
    const pageContent = await page.content();
    const isLoginRedirect = page.url().includes('vercel.com/login');
    const hasScheduleText = pageContent.includes('스케줄') || pageContent.includes('schedule');
    const hasApprovalText = pageContent.includes('승인') || pageContent.includes('approve') || pageContent.includes('pending');
    
    console.log('📊 메인 페이지 분석 결과:');
    console.log(`   - Vercel 로그인 리다이렉트: ${isLoginRedirect ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 스케줄 관련 텍스트: ${hasScheduleText ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   - 승인 관련 텍스트: ${hasApprovalText ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   - 페이지 크기: ${pageContent.length} 문자`);
    
    if (isLoginRedirect) {
      console.log('🔒 로그인이 필요한 상태입니다');
      console.log('💡 Vercel에서 GitHub 로그인을 진행해야 합니다');
      
      // Vercel 로그인 페이지 스크린샷
      await page.screenshot({ path: 'test-results/vercel-login-required.png' });
      console.log('📸 Vercel 로그인 필요 스크린샷 저장 완료');
      
      // 3단계: GitHub 로그인 시도
      console.log('🔗 3단계: GitHub 로그인 시도...');
      
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
        
        // 4단계: 사용자에게 로그인 완료 대기 안내
        console.log('⏳ 4단계: 사용자에게 로그인 완료 대기 안내...');
        console.log('=====================================');
        console.log('🎯 Chromium Nightly에서 GitHub 로그인:');
        console.log('   1. GitHub 로그인 페이지에서 비밀번호 입력');
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
        
        // 5단계: 로그인 후 MASLABS 앱 접근 시도
        console.log('🚀 5단계: 로그인 후 MASLABS 앱 접근 시도...');
        
        const currentUrl = page.url();
        const isOnMaslabsApp = currentUrl.includes('mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
        
        if (isOnMaslabsApp) {
          console.log('🎉 MASLABS 앱 접근 성공!');
          
          // 6단계: 스케줄 추가 페이지 접근
          console.log('🔗 6단계: 스케줄 추가 페이지 접근...');
          await page.goto(`${baseUrl}/schedules/add`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          console.log('✅ 스케줄 추가 페이지 접근 완료');
          console.log('🔗 현재 URL:', page.url());
          console.log('📄 페이지 제목:', await page.title());
          
          // 스케줄 추가 페이지 스크린샷
          await page.screenshot({ path: 'test-results/schedule-add-page.png' });
          console.log('📸 스케줄 추가 페이지 스크린샷 저장 완료');
          
          // 7단계: 승인 상태 확인
          console.log('🔍 7단계: 승인 상태 확인...');
          
          const schedulePageContent = await page.content();
          
          // 승인 관련 텍스트 확인
          const hasApprovedText = schedulePageContent.includes('승인됨') || schedulePageContent.includes('approved');
          const hasPendingText = schedulePageContent.includes('대기중') || schedulePageContent.includes('pending');
          const hasApprovalButtons = schedulePageContent.includes('승인') || schedulePageContent.includes('approve');
          
          console.log('📊 스케줄 승인 상태 분석:');
          console.log(`   - 승인됨 상태: ${hasApprovedText ? '✅ 발견' : '❌ 없음'}`);
          console.log(`   - 대기중 상태: ${hasPendingText ? '✅ 발견' : '❌ 없음'}`);
          console.log(`   - 승인 버튼: ${hasApprovalButtons ? '✅ 발견' : '❌ 없음'}`);
          
          // 날짜 필드 확인
          const dateField = page.locator('input[type="date"], input[name="scheduleDate"]');
          if (await dateField.isVisible()) {
            const currentDate = await dateField.inputValue();
            const today = new Date().toISOString().split('T')[0];
            
            console.log('📅 날짜 필드 확인:');
            console.log(`   - 현재 설정된 날짜: ${currentDate}`);
            console.log(`   - 오늘 날짜: ${today}`);
            console.log(`   - 날짜 일치: ${currentDate === today ? '✅ 예' : '❌ 아니오'}`);
          } else {
            console.log('❌ 날짜 필드를 찾을 수 없음');
          }
          
          // 최종 스크린샷
          await page.screenshot({ path: 'test-results/schedule-approval-final.png' });
          console.log('📸 스케줄 승인 상태 최종 스크린샷 저장 완료');
          
        } else {
          console.log('❌ MASLABS 앱 접근 실패');
          console.log('💡 여전히 Vercel 로그인 페이지에 있음');
          
          // 최종 스크린샷
          await page.screenshot({ path: 'test-results/maslabs-access-failed.png' });
          console.log('📸 MASLABS 앱 접근 실패 스크린샷 저장 완료');
        }
        
      } else {
        console.log('❌ GitHub 로그인 버튼을 찾을 수 없음');
        console.log('💡 Vercel 로그인 페이지 구조가 변경되었을 수 있습니다');
      }
      
    } else {
      console.log('✅ 이미 로그인된 상태입니다');
      console.log('🚀 바로 스케줄 추가 페이지로 이동합니다');
      
      // 스케줄 추가 페이지로 직접 이동
      await page.goto(`${baseUrl}/schedules/add`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log('✅ 스케줄 추가 페이지 접근 완료');
      console.log('🔗 현재 URL:', page.url());
      console.log('📄 페이지 제목:', await page.title());
      
      // 스케줄 추가 페이지 스크린샷
      await page.screenshot({ path: 'test-results/schedule-add-page-direct.png' });
      console.log('📸 스케줄 추가 페이지 직접 접근 스크린샷 저장 완료');
    }
    
    // 8단계: 최종 결과 요약
    console.log('📊 8단계: 최종 결과 요약');
    console.log('=====================================');
    console.log('🎯 Chromium Nightly MASLABS 스케줄 테스트 결과:');
    console.log(`   - 메인 페이지 접근: ✅ 성공`);
    console.log(`   - 로그인 상태: ${isLoginRedirect ? '🔒 필요' : '✅ 완료'}`);
    console.log(`   - 스케줄 추가 페이지: ${page.url().includes('/schedules/add') ? '✅ 접근' : '❌ 실패'}`);
    console.log(`   - 승인 상태 확인: ${hasApprovalText ? '✅ 가능' : '❌ 불가'}`);
    console.log('=====================================');
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/maslabs-schedule-test-final.png' });
    console.log('📸 최종 결과 스크린샷 저장 완료');
    
    console.log('🎉 Chromium Nightly MASLABS 스케줄 테스트 완료!');
  });
});
