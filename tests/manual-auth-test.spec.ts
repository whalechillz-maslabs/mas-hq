import { test, expect } from '@playwright/test';

test.describe('수동 인증 후 스케줄 추가 페이지 테스트', () => {
  test('사용자가 이미 인증된 상태에서 스케줄 추가 페이지 접근', async ({ page }) => {
    console.log('🚀 수동 인증 후 스케줄 추가 페이지 테스트 시작');
    console.log('💡 이미 Vercel에 로그인된 상태에서 테스트를 진행합니다');
    
    // 사용자가 이미 인증된 상태에서 MASLABS 앱으로 직접 접근
    console.log('🔗 MASLABS 앱으로 접근 시도...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('✅ MASLABS 앱 접속 완료');
    
    // 현재 상태 확인
    const currentUrl = page.url();
    const title = await page.title();
    console.log('🔗 현재 URL:', currentUrl);
    console.log('📄 페이지 제목:', title);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/manual-auth-maslabs-app.png' });
    console.log('📸 MASLABS 앱 접근 스크린샷 저장 완료');
    
    // 로그인 페이지인지 확인
    if (currentUrl.includes('/login') || title.includes('Login')) {
      console.log('❌ 여전히 로그인 페이지에 있음');
      console.log('💡 Vercel에서 로그아웃 후 다시 로그인해보세요');
      return;
    }
    
    console.log('✅ 로그인 페이지를 벗어남 - 인증 성공!');
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    console.log('📝 페이지 내용 (처음 500자):', pageContent?.substring(0, 500));
    
    // 이제 스케줄 추가 페이지로 이동 시도
    console.log('🔗 스케줄 추가 페이지로 이동 시도...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 스케줄 추가 페이지 상태 확인
    const scheduleUrl = page.url();
    const scheduleTitle = await page.title();
    console.log('🔗 스케줄 추가 페이지 URL:', scheduleUrl);
    console.log('📄 스케줄 추가 페이지 제목:', scheduleTitle);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/manual-auth-schedule-add.png' });
    console.log('📸 스케줄 추가 페이지 접근 스크린샷 저장 완료');
    
    // 스케줄 추가 페이지 요소 확인
    const expectedElements = [
      'text=새 스케줄 추가',
      'input[type="date"]',
      'text=기존 스케줄',
      'text=시간대별 근무자 현황'
    ];
    
    console.log('🔍 스케줄 추가 페이지 요소 확인 중...');
    for (const selector of expectedElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        console.log(`✅ ${selector} 표시됨`);
      } else {
        console.log(`❌ ${selector} 표시되지 않음`);
      }
    }
    
    // 핵심 테스트: 날짜 입력 필드 값 확인
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
    
    console.log('🎉 수동 인증 후 스케줄 추가 페이지 테스트 완료');
  });
});
