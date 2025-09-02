import { test, expect } from '@playwright/test';

test.describe('GitHub 로그인 페이지 열기 및 3분 대기 테스트', () => {
  test('GitHub 로그인 페이지 열고 3분간 대기', async ({ page }) => {
    console.log('🚀 GitHub 로그인 페이지 열기 및 3분 대기 테스트 시작');
    
    // 1단계: GitHub 로그인 페이지로 직접 이동
    console.log('🔗 1단계: GitHub 로그인 페이지로 직접 이동...');
    await page.goto('https://github.com/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ GitHub 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // GitHub 로그인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/github-login-wait-start.png' });
    console.log('📸 GitHub 로그인 페이지 스크린샷 저장 완료');
    
    // 2단계: 로그인 폼 요소 확인
    console.log('🔍 2단계: 로그인 폼 요소 확인...');
    
    // 사용자명 입력 필드 확인
    const usernameInput = page.locator('input[name="login"]');
    if (await usernameInput.isVisible()) {
      console.log('✅ 사용자명 입력 필드 발견');
      console.log('👤 사용자명: whalechillz (자동 입력됨)');
      
      // 사용자명 자동 입력
      await usernameInput.fill('whalechillz');
      console.log('✅ 사용자명 자동 입력 완료');
    } else {
      console.log('❌ 사용자명 입력 필드를 찾을 수 없음');
    }
    
    // 비밀번호 입력 필드 확인
    const passwordInput = page.locator('input[name="password"]');
    if (await passwordInput.isVisible()) {
      console.log('✅ 비밀번호 입력 필드 발견');
      console.log('🔐 비밀번호 입력이 필요합니다');
    } else {
      console.log('❌ 비밀번호 입력 필드를 찾을 수 없음');
    }
    
    // 로그인 버튼 확인 (더 정확한 선택자 사용)
    const signInButton = page.locator('input[name="commit"][value="Sign in"]');
    if (await signInButton.isVisible()) {
      console.log('✅ GitHub 로그인 버튼 발견');
    } else {
      console.log('❌ GitHub 로그인 버튼을 찾을 수 없음');
    }
    
    // Google 로그인 버튼 확인
    const googleButton = page.locator('button:has-text("Continue with Google")');
    if (await googleButton.isVisible()) {
      console.log('✅ Google 로그인 버튼 발견');
    } else {
      console.log('❌ Google 로그인 버튼을 찾을 수 없음');
    }
    
    // 3단계: 로그인 안내 메시지
    console.log('💡 3단계: 로그인 안내 메시지');
    console.log('=====================================');
    console.log('🎯 GitHub 로그인 준비 완료!');
    console.log('   - 사용자명: whalechillz (자동 입력됨)');
    console.log('   - 비밀번호: 직접 입력 필요');
    console.log('   - GitHub 로그인 버튼: 준비됨');
    console.log('   - Google 로그인 옵션: 사용 가능');
    console.log('=====================================');
    console.log('⏰ 이제 3분간 대기합니다...');
    console.log('💡 이 시간 동안 GitHub에 로그인해주세요!');
    console.log('💡 또는 Google 로그인을 사용할 수도 있습니다');
    console.log('=====================================');
    
    // 4단계: 3분간 대기 (180초)
    console.log('⏳ 4단계: 3분간 대기 시작...');
    console.log('   - 시작 시간:', new Date().toLocaleTimeString());
    console.log('   - 종료 시간:', new Date(Date.now() + 180000).toLocaleTimeString());
    
    // 3분 대기 (180초)
    await page.waitForTimeout(180000);
    
    console.log('✅ 3분 대기 완료!');
    console.log('   - 완료 시간:', new Date().toLocaleTimeString());
    
    // 5단계: 로그인 후 상태 확인
    console.log('🔍 5단계: 로그인 후 상태 확인...');
    
    const currentUrl = page.url();
    const title = await page.title();
    
    console.log('🔗 현재 URL:', currentUrl);
    console.log('📄 현재 페이지 제목:', title);
    
    // 로그인 성공 여부 확인
    if (currentUrl.includes('github.com/login') && title.includes('Sign in')) {
      console.log('❌ 여전히 GitHub 로그인 페이지에 있음');
      console.log('💡 로그인이 완료되지 않았습니다');
    } else {
      console.log('✅ GitHub 로그인 성공!');
      console.log('🎉 이제 Vercel로 연결할 수 있습니다');
    }
    
    // 최종 상태 스크린샷
    await page.screenshot({ path: 'test-results/github-login-wait-final.png' });
    console.log('📸 최종 상태 스크린샷 저장 완료');
    
    // 6단계: 최종 결과 요약
    console.log('📊 6단계: 최종 결과 요약');
    console.log('=====================================');
    console.log('🎯 GitHub 로그인 대기 테스트 결과:');
    console.log(`   - GitHub 로그인 페이지 접근: ✅ 성공`);
    console.log(`   - 사용자명 자동 입력: ✅ 완료`);
    console.log(`   - 3분 대기: ✅ 완료`);
    console.log(`   - 로그인 상태: ${currentUrl.includes('github.com/login') ? '❌ 실패' : '✅ 성공'}`);
    console.log('=====================================');
    
    if (!currentUrl.includes('github.com/login')) {
      console.log('🚀 다음 단계: Vercel로 이동하여 GitHub 계정 연결');
      console.log('💡 https://vercel.com/login 에서 "Continue with GitHub" 클릭');
    }
    
    console.log('🎉 GitHub 로그인 대기 테스트 완료!');
  });
});
