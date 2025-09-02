import { test, expect } from '@playwright/test';

test.describe('간단한 로그인 대기 테스트', () => {
  test('브라우저 열고 로그인 대기', async ({ page }) => {
    console.log('🚀 브라우저 인스턴스 열기 시작');
    
    // Vercel 로그인 페이지로 이동
    await page.goto('https://vercel.com/login');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Vercel 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/simple-wait-login-start.png' });
    console.log('📸 로그인 페이지 스크린샷 저장 완료');
    
    // 사용자가 수동으로 로그인할 때까지 대기
    console.log('⏳ 사용자가 수동으로 로그인을 완료할 때까지 대기 중...');
    console.log('💡 다음 단계를 진행해주세요:');
    console.log('   1. "Continue with Google" 버튼 클릭');
    console.log('   2. whalechillz@gmail.com으로 로그인');
    console.log('   3. Vercel 권한 승인');
    console.log('   4. 로그인이 완료되면 이 창에서 아무 키나 누르세요');
    
    // 사용자가 로그인을 완료할 때까지 대기 (5분)
    console.log('⏰ 5분간 대기 중... 사용자가 로그인을 완료해주세요');
    await page.waitForTimeout(300000); // 5분 대기
    
    console.log('✅ 로그인 대기 완료');
    
    // 로그인 후 상태 확인
    const currentUrl = page.url();
    const title = await page.title();
    
    console.log('🔗 로그인 후 현재 URL:', currentUrl);
    console.log('📄 로그인 후 페이지 제목:', title);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/simple-wait-after-login.png' });
    console.log('📸 로그인 후 상태 스크린샷 저장 완료');
    
    console.log('🎉 간단한 로그인 대기 테스트 완료');
  });
});
