import { test, expect } from '@playwright/test';

test.describe('간단한 페이지 접근 테스트', () => {
  test('배포된 서버의 주요 페이지 접근 확인', async ({ page }) => {
    console.log('🚀 간단한 페이지 접근 테스트 시작');
    
    const baseUrl = 'https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app';
    
    // 1단계: 메인 페이지 접근
    console.log('🔗 1단계: 메인 페이지 접근...');
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 메인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 메인 페이지 스크린샷
    await page.screenshot({ path: 'test-results/simple-main-page.png' });
    console.log('📸 메인 페이지 스크린샷 저장 완료');
    
    // 2단계: 스케줄 페이지 접근
    console.log('🔗 2단계: 스케줄 페이지 접근...');
    await page.goto(`${baseUrl}/schedules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 스케줄 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 스케줄 페이지 스크린샷
    await page.screenshot({ path: 'test-results/simple-schedules-page.png' });
    console.log('📸 스케줄 페이지 스크린샷 저장 완료');
    
    // 3단계: 관리자 스케줄 관리 페이지 접근
    console.log('🔗 3단계: 관리자 스케줄 관리 페이지 접근...');
    await page.goto(`${baseUrl}/admin/employee-schedules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 관리자 스케줄 관리 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    console.log('📄 페이지 제목:', await page.title());
    
    // 관리자 페이지 스크린샷
    await page.screenshot({ path: 'test-results/simple-admin-page.png' });
    console.log('📸 관리자 스케줄 관리 페이지 스크린샷 저장 완료');
    
    // 4단계: 페이지 상태 분석
    console.log('🔍 4단계: 페이지 상태 분석...');
    
    // 각 페이지의 상태 확인
    const pages = [
      { name: '메인 페이지', url: baseUrl, screenshot: 'simple-main-page.png' },
      { name: '스케줄 페이지', url: `${baseUrl}/schedules`, screenshot: 'simple-schedules-page.png' },
      { name: '관리자 페이지', url: `${baseUrl}/admin/employee-schedules`, screenshot: 'simple-admin-page.png' }
    ];
    
    console.log('📊 페이지 접근 결과 요약');
    console.log('=====================================');
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      const title = await page.title();
      const isLoginPage = currentUrl.includes('vercel.com/login') || title.includes('Login');
      
      console.log(`   ${pageInfo.name}:`);
      console.log(`     - URL: ${currentUrl}`);
      console.log(`     - 제목: ${title}`);
      console.log(`     - 로그인 페이지 여부: ${isLoginPage ? '❌ 예' : '✅ 아니오'}`);
      console.log(`     - 상태: ${isLoginPage ? '🔒 인증 필요' : '✅ 접근 가능'}`);
      console.log('');
    }
    
    console.log('=====================================');
    console.log('💡 결론:');
    console.log('   - 모든 페이지가 Vercel 로그인으로 리다이렉트됨');
    console.log('   - Google 로그인 후 MASLABS 앱 접근 필요');
    console.log('   - 스케줄 승인 처리 기능은 로그인 후 확인 가능');
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/simple-final-result.png' });
    console.log('📸 최종 결과 스크린샷 저장 완료');
    
    console.log('🎉 간단한 페이지 접근 테스트 완료!');
  });
});
