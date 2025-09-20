import { test, expect } from '@playwright/test';

test.describe('수동 로그인 대기 테스트', () => {
  test('브라우저 열고 수동 로그인 대기', async ({ page }) => {
    console.log('🚀 브라우저 인스턴스 열기 시작');
    
    // Vercel 로그인 페이지로 이동
    await page.goto('https://vercel.com/login');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Vercel 로그인 페이지 접속 완료');
    console.log('🔗 현재 URL:', page.url());
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/wait-for-login-start.png' });
    console.log('📸 로그인 페이지 스크린샷 저장 완료');
    
    // 사용자가 수동으로 로그인할 때까지 대기
    console.log('⏳ 사용자가 수동으로 로그인을 완료할 때까지 대기 중...');
    console.log('💡 다음 단계를 진행해주세요:');
    console.log('   1. "Continue with Google" 버튼 클릭');
    console.log('   2. whalechillz@gmail.com으로 로그인');
    console.log('   3. Vercel 권한 승인');
    console.log('   4. 로그인이 완료되면 이 창에서 아무 키나 누르세요');
    
    // 사용자가 로그인을 완료할 때까지 대기 (5분)
    await page.waitForTimeout(600000); // 10분 대기
    
    console.log('✅ 로그인 대기 완료');
    
    // 로그인 후 상태 확인
    const currentUrl = page.url();
    const title = await page.title();
    
    console.log('🔗 로그인 후 현재 URL:', currentUrl);
    console.log('📄 로그인 후 페이지 제목:', title);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/after-manual-login.png' });
    console.log('📸 로그인 후 상태 스크린샷 저장 완료');
    
    // 로그인 성공 여부 확인
    if (currentUrl.includes('/login') || title.includes('Login')) {
      console.log('❌ 여전히 로그인 페이지에 있음');
      console.log('💡 로그인이 완료되지 않았습니다. 다시 시도해주세요.');
    } else {
      console.log('✅ 로그인 성공! 로그인 페이지를 벗어남');
      
      // 이제 MASLABS 앱으로 이동 시도
      console.log('🔗 MASLABS 앱으로 이동 시도...');
      await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const maslabsUrl = page.url();
      const maslabsTitle = await page.title();
      
      console.log('🔗 MASLABS 앱 URL:', maslabsUrl);
      console.log('📄 MASLABS 앱 제목:', maslabsTitle);
      
      // MASLABS 앱 스크린샷 저장
      await page.screenshot({ path: 'test-results/maslabs-app-after-login.png' });
      console.log('📸 MASLABS 앱 접근 스크린샷 저장 완료');
      
      // 스케줄 추가 페이지로 이동
      console.log('🔗 스케줄 추가 페이지로 이동 시도...');
      await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const scheduleUrl = page.url();
      const scheduleTitle = await page.title();
      
      console.log('🔗 스케줄 추가 페이지 URL:', scheduleUrl);
      console.log('📄 스케줄 추가 페이지 제목:', scheduleTitle);
      
      // 스케줄 추가 페이지 스크린샷 저장
      await page.screenshot({ path: 'test-results/schedule-add-after-login.png' });
      console.log('📸 스케줄 추가 페이지 접근 스크린샷 저장 완료');
      
      // 핵심 테스트: 날짜 입력 필드 확인
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible()) {
        const dateValue = await dateInput.inputValue();
        console.log('📅 날짜 입력 필드 값:', dateValue);
        
        // 현재 날짜와 비교
        const currentDate = new Date();
        const expectedDate = currentDate.toISOString().split('T')[0];
        console.log('📅 예상 날짜 (현재 날짜):', expectedDate);
        
        if (dateValue === expectedDate) {
          console.log('🎉 성공! 날짜가 현재 날짜로 올바르게 설정됨!');
          console.log('✅ 하드코딩된 날짜 문제가 해결되었습니다!');
        } else {
          console.log('❌ 날짜가 예상과 다름');
          console.log('🔍 문제: 하드코딩된 날짜가 여전히 사용되고 있음');
        }
      } else {
        console.log('❌ 날짜 입력 필드를 찾을 수 없음');
      }
    }
    
    console.log('🎉 수동 로그인 대기 테스트 완료');
  });
});
