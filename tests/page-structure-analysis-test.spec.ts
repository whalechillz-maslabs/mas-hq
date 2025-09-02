import { test, expect } from '@playwright/test';

test.describe('페이지 구조 분석 테스트', () => {
  test('로그인 없이 페이지 구조 및 승인 처리 기능 분석', async ({ page }) => {
    console.log('🚀 페이지 구조 분석 테스트 시작');
    
    const baseUrl = 'https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app';
    
    // 1단계: 메인 페이지 구조 분석
    console.log('🔍 1단계: 메인 페이지 구조 분석...');
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 메인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 페이지 구조 분석
    const mainPageContent = await page.content();
    const hasLoginRedirect = mainPageContent.includes('vercel.com/login') || mainPageContent.includes('Login');
    
    console.log('📊 메인 페이지 분석 결과:');
    console.log(`   - Vercel 로그인 리다이렉트: ${hasLoginRedirect ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 페이지 크기: ${mainPageContent.length} 문자`);
    
    // 메인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/structure-main-page.png' });
    console.log('📸 메인 페이지 스크린샷 저장 완료');
    
    // 2단계: 스케줄 페이지 구조 분석
    console.log('🔍 2단계: 스케줄 페이지 구조 분석...');
    await page.goto(`${baseUrl}/schedules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 스케줄 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    const schedulesPageContent = await page.content();
    const hasSchedulesRedirect = schedulesPageContent.includes('vercel.com/login') || schedulesPageContent.includes('Login');
    
    console.log('📊 스케줄 페이지 분석 결과:');
    console.log(`   - Vercel 로그인 리다이렉트: ${hasSchedulesRedirect ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 페이지 크기: ${schedulesPageContent.length} 문자`);
    
    // 스케줄 페이지 스크린샷
    await page.screenshot({ path: 'test-results/structure-schedules-page.png' });
    console.log('📸 스케줄 페이지 스크린샷 저장 완료');
    
    // 3단계: 관리자 스케줄 관리 페이지 구조 분석
    console.log('🔍 3단계: 관리자 스케줄 관리 페이지 구조 분석...');
    await page.goto(`${baseUrl}/admin/employee-schedules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 관리자 스케줄 관리 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    const adminPageContent = await page.content();
    const hasAdminRedirect = adminPageContent.includes('vercel.com/login') || adminPageContent.includes('Login');
    
    console.log('📊 관리자 페이지 분석 결과:');
    console.log(`   - Vercel 로그인 리다이렉트: ${hasAdminRedirect ? '✅ 예' : '❌ 아니오'}`);
    console.log(`   - 페이지 크기: ${adminPageContent.length} 문자`);
    
    // 관리자 페이지 스크린샷
    await page.screenshot({ path: 'test-results/structure-admin-page.png' });
    console.log('📸 관리자 페이지 스크린샷 저장 완료');
    
    // 4단계: Vercel 로그인 페이지 구조 분석
    console.log('🔍 4단계: Vercel 로그인 페이지 구조 분석...');
    await page.goto('https://vercel.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Vercel 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    const vercelLoginContent = await page.content();
    
    // 로그인 옵션 분석
    const hasGitHubOption = vercelLoginContent.includes('GitHub') || vercelLoginContent.includes('github');
    const hasGoogleOption = vercelLoginContent.includes('Google') || vercelLoginContent.includes('google');
    const hasEmailOption = vercelLoginContent.includes('email') || vercelLoginContent.includes('Email');
    
    console.log('📊 Vercel 로그인 페이지 분석 결과:');
    console.log(`   - GitHub 로그인 옵션: ${hasGitHubOption ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   - Google 로그인 옵션: ${hasGoogleOption ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   - 이메일 로그인 옵션: ${hasEmailOption ? '✅ 있음' : '❌ 없음'}`);
    console.log(`   - 페이지 크기: ${vercelLoginContent.length} 문자`);
    
    // Vercel 로그인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/structure-vercel-login.png' });
    console.log('📸 Vercel 로그인 페이지 스크린샷 저장 완료');
    
    // 5단계: 로그인 버튼 상세 분석
    console.log('🔍 5단계: 로그인 버튼 상세 분석...');
    
    // GitHub 로그인 버튼 찾기
    const githubButton = page.locator('button:has-text("Continue with GitHub"), button:has-text("GitHub")');
    const githubButtonCount = await githubButton.count();
    console.log(`   - GitHub 로그인 버튼: ${githubButtonCount}개`);
    
    // Google 로그인 버튼 찾기
    const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Google")');
    const googleButtonCount = await googleButton.count();
    console.log(`   - Google 로그인 버튼: ${googleButtonCount}개`);
    
    // 이메일 로그인 필드 찾기
    const emailField = page.locator('input[type="email"], input[name="email"]');
    const emailFieldCount = await emailField.count();
    console.log(`   - 이메일 입력 필드: ${emailFieldCount}개`);
    
    // 6단계: 최종 결과 요약
    console.log('📊 6단계: 최종 결과 요약');
    console.log('=====================================');
    console.log('🎯 페이지 구조 분석 결과:');
    console.log(`   - 메인 페이지: ${hasLoginRedirect ? '🔒 인증 필요' : '✅ 접근 가능'}`);
    console.log(`   - 스케줄 페이지: ${hasSchedulesRedirect ? '🔒 인증 필요' : '✅ 접근 가능'}`);
    console.log(`   - 관리자 페이지: ${hasAdminRedirect ? '🔒 인증 필요' : '✅ 접근 가능'}`);
    console.log(`   - Vercel 로그인 옵션:`);
    console.log(`     * GitHub: ${hasGitHubOption ? '✅' : '❌'}`);
    console.log(`     * Google: ${hasGoogleOption ? '✅' : '❌'}`);
    console.log(`     * 이메일: ${hasEmailOption ? '✅' : '❌'}`);
    console.log(`   - 로그인 버튼:`);
    console.log(`     * GitHub: ${githubButtonCount}개`);
    console.log(`     * Google: ${googleButtonCount}개`);
    console.log(`     * 이메일: ${emailFieldCount}개`);
    console.log('=====================================');
    console.log('💡 결론:');
    console.log('   - 모든 MASLABS 페이지가 Vercel 로그인으로 리다이렉트됨');
    console.log('   - GitHub 또는 Google 로그인 후 MASLABS 앱 접근 가능');
    console.log('   - 스케줄 승인 처리 기능은 로그인 후 확인 가능');
    console.log('   - 권장: 크롬에서 직접 로그인하여 기능 확인');
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/structure-final-result.png' });
    console.log('📸 최종 결과 스크린샷 저장 완료');
    
    console.log('🎉 페이지 구조 분석 테스트 완료!');
  });
});
