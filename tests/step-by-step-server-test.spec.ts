import { test, expect } from '@playwright/test';

test.describe('단계별 서버 접속 테스트', () => {
  test('로그아웃 상태에서 단계별로 서버 접근 확인', async ({ page }) => {
    console.log('🚀 단계별 서버 접속 테스트 시작');
    
    const baseUrl = 'https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app';
    
    // 1단계: 메인 페이지 접근
    console.log('🔗 1단계: 메인 페이지 접근...');
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 메인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 메인 페이지 상태 분석
    const mainPageContent = await page.content();
    const isLoginRedirect = page.url().includes('vercel.com/login');
    const hasLoginForm = mainPageContent.includes('login') || mainPageContent.includes('Login');
    
    console.log('📊 메인 페이지 분석 결과:');
    console.log(`   - Vercel 로그인 리다이렉트: ${isLoginRedirect ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 로그인 폼 포함: ${hasLoginForm ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 페이지 크기: ${mainPageContent.length} 문자`);
    
    // 메인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/step1-main-page.png' });
    console.log('📸 메인 페이지 스크린샷 저장 완료');
    
    // 2단계: Vercel 로그인 페이지 분석
    console.log('🔍 2단계: Vercel 로그인 페이지 분석...');
    
    // 로그인 옵션 분석 (변수 스코프 문제 해결)
    let hasGitHubOption = false;
    let hasGoogleOption = false;
    let hasEmailOption = false;
    
    if (isLoginRedirect) {
      console.log('✅ Vercel 로그인 페이지로 리다이렉트됨');
      
      // 로그인 옵션 분석
      hasGitHubOption = mainPageContent.includes('GitHub') || mainPageContent.includes('github');
      hasGoogleOption = mainPageContent.includes('Google') || mainPageContent.includes('google');
      hasEmailOption = mainPageContent.includes('email') || mainPageContent.includes('Email');
      
      console.log('📊 Vercel 로그인 옵션 분석:');
      console.log(`   - GitHub 로그인: ${hasGitHubOption ? '✅ 있음' : '❌ 없음'}`);
      console.log(`   - Google 로그인: ${hasGoogleOption ? '✅ 있음' : '❌ 없음'}`);
      console.log(`   - 이메일 로그인: ${hasEmailOption ? '✅ 있음' : '❌ 없음'}`);
      
      // 로그인 버튼 개수 확인
      const githubButton = page.locator('button:has-text("Continue with GitHub"), button:has-text("GitHub")');
      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Google")');
      const emailField = page.locator('input[type="email"], input[name="email"]');
      
      const githubCount = await githubButton.count();
      const googleCount = await googleButton.count();
      const emailCount = await emailField.count();
      
      console.log('📊 로그인 버튼 개수:');
      console.log(`   - GitHub: ${githubCount}개`);
      console.log(`   - Google: ${googleCount}개`);
      console.log(`   - 이메일: ${emailCount}개`);
      
    } else {
      console.log('❌ Vercel 로그인 페이지로 리다이렉트되지 않음');
    }
    
    // 3단계: 스케줄 페이지 접근 시도
    console.log('🔗 3단계: 스케줄 페이지 접근 시도...');
    await page.goto(`${baseUrl}/schedules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 스케줄 페이지 접속 시도 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    const schedulesPageContent = await page.content();
    const isSchedulesRedirect = page.url().includes('vercel.com/login');
    
    console.log('📊 스케줄 페이지 분석 결과:');
    console.log(`   - Vercel 로그인 리다이렉트: ${isSchedulesRedirect ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 페이지 크기: ${schedulesPageContent.length} 문자`);
    
    // 스케줄 페이지 스크린샷
    await page.screenshot({ path: 'test-results/step3-schedules-page.png' });
    console.log('📸 스케줄 페이지 스크린샷 저장 완료');
    
    // 4단계: 관리자 페이지 접근 시도
    console.log('🔗 4단계: 관리자 페이지 접근 시도...');
    await page.goto(`${baseUrl}/admin/employee-schedules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 관리자 페이지 접속 시도 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    const adminPageContent = await page.content();
    const isAdminRedirect = page.url().includes('vercel.com/login');
    
    console.log('📊 관리자 페이지 분석 결과:');
    console.log(`   - Vercel 로그인 리다이렉트: ${isAdminRedirect ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 페이지 크기: ${adminPageContent.length} 문자`);
    
    // 관리자 페이지 스크린샷
    await page.screenshot({ path: 'test-results/step4-admin-page.png' });
    console.log('📸 관리자 페이지 스크린샷 저장 완료');
    
    // 5단계: 스케줄 추가 페이지 접근 시도
    console.log('🔗 5단계: 스케줄 추가 페이지 접근 시도...');
    await page.goto(`${baseUrl}/schedules/add`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 스케줄 추가 페이지 접속 시도 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    const addPageContent = await page.content();
    const isAddRedirect = page.url().includes('vercel.com/login');
    
    console.log('📊 스케줄 추가 페이지 분석 결과:');
    console.log(`   - Vercel 로그인 리다이렉트: ${isAddRedirect ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 페이지 크기: ${addPageContent.length} 문자`);
    
    // 스케줄 추가 페이지 스크린샷
    await page.screenshot({ path: 'test-results/step5-add-page.png' });
    console.log('📸 스케줄 추가 페이지 스크린샷 저장 완료');
    
    // 6단계: 최종 결과 요약
    console.log('📊 6단계: 최종 결과 요약');
    console.log('=====================================');
    console.log('🎯 단계별 서버 접속 테스트 결과:');
    console.log(`   - 메인 페이지: ${isLoginRedirect ? '🔒 인증 필요' : '✅ 접근 가능'}`);
    console.log(`   - 스케줄 페이지: ${isSchedulesRedirect ? '🔒 인증 필요' : '✅ 접근 가능'}`);
    console.log(`   - 관리자 페이지: ${isAdminRedirect ? '🔒 인증 필요' : '✅ 접근 가능'}`);
    console.log(`   - 스케줄 추가 페이지: ${isAddRedirect ? '🔒 인증 필요' : '✅ 접근 가능'}`);
    console.log('=====================================');
    
    if (isLoginRedirect) {
      console.log('💡 Vercel 로그인 옵션:');
      console.log(`   - GitHub: ${hasGitHubOption ? '✅' : '❌'}`);
      console.log(`   - Google: ${hasGoogleOption ? '✅' : '❌'}`);
      console.log(`   - 이메일: ${hasEmailOption ? '✅' : '❌'}`);
      console.log('');
      console.log('🚀 다음 단계: Vercel에서 GitHub 로그인 시도');
      console.log('💡 "Continue with GitHub" 버튼 클릭하여 로그인 진행');
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/step6-final-result.png' });
    console.log('📸 최종 결과 스크린샷 저장 완료');
    
    console.log('🎉 단계별 서버 접속 테스트 완료!');
  });
});
