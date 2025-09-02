import { test, expect } from '@playwright/test';

test.describe('로그인 완료 후 상태 확인 테스트', () => {
  test('Vercel 로그인 상태 및 MASLABS 앱 접근 확인', async ({ page }) => {
    console.log('🚀 로그인 완료 후 상태 확인 테스트 시작');
    console.log('💡 사용자가 이미 Vercel에 로그인한 상태에서 테스트를 진행합니다');
    
    // 1단계: Vercel 대시보드 접근 시도
    console.log('🔗 1단계: Vercel 대시보드 접근 시도...');
    await page.goto('https://vercel.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 현재 상태 확인
    const currentUrl = page.url();
    const title = await page.title();
    
    console.log('🔗 현재 URL:', currentUrl);
    console.log('📄 페이지 제목:', title);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/vercel-dashboard-check.png' });
    console.log('📸 Vercel 대시보드 상태 스크린샷 저장 완료');
    
    // 로그인 상태 확인
    if (currentUrl.includes('/login') || title.includes('Login')) {
      console.log('❌ 여전히 로그인 페이지에 있음');
      console.log('💡 Vercel 로그인이 완료되지 않았습니다.');
      return;
    }
    
    console.log('✅ Vercel 로그인 성공! 대시보드에 접근됨');
    
    // 2단계: MASLABS 프로젝트 확인
    console.log('🔗 2단계: MASLABS 프로젝트 확인...');
    
    // 프로젝트 목록에서 MASLABS 찾기
    const maslabsProject = page.locator('text=mas-hq, text=MASLABS, text=whalechillz-maslabs');
    if (await maslabsProject.isVisible()) {
      console.log('✅ MASLABS 프로젝트 발견');
    } else {
      console.log('ℹ️ MASLABS 프로젝트가 보이지 않음 (직접 URL로 접근 시도)');
    }
    
    // 3단계: MASLABS 앱 직접 접근
    console.log('🔗 3단계: MASLABS 앱 직접 접근...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const maslabsUrl = page.url();
    const maslabsTitle = await page.title();
    
    console.log('🔗 MASLABS 앱 URL:', maslabsUrl);
    console.log('📄 MASLABS 앱 제목:', maslabsTitle);
    
    // MASLABS 앱 스크린샷 저장
    await page.screenshot({ path: 'test-results/maslabs-app-check.png' });
    console.log('📸 MASLABS 앱 접근 스크린샷 저장 완료');
    
    // 4단계: 스케줄 추가 페이지 접근
    console.log('🔗 4단계: 스케줄 추가 페이지 접근...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const scheduleUrl = page.url();
    const scheduleTitle = await page.title();
    
    console.log('🔗 스케줄 추가 페이지 URL:', scheduleUrl);
    console.log('📄 스케줄 추가 페이지 제목:', scheduleTitle);
    
    // 스케줄 추가 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/schedule-add-page-check.png' });
    console.log('📸 스케줄 추가 페이지 접근 스크린샷 저장 완료');
    
    // 5단계: 핵심 테스트 - 날짜 입력 필드 확인
    console.log('🔍 5단계: 날짜 입력 필드 확인 (핵심 테스트)...');
    
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
        console.log('   - 예상: ' + expectedDate);
        console.log('   - 실제: ' + dateValue);
      }
    } else {
      console.log('❌ 날짜 입력 필드를 찾을 수 없음');
    }
    
    // 6단계: 기타 페이지 요소 확인
    console.log('🔍 6단계: 기타 페이지 요소 확인...');
    
    const expectedElements = [
      'text=새 스케줄 추가',
      'text=기존 스케줄',
      'text=시간대별 근무자 현황',
      'button:has-text("취소")',
      'button:has-text("스케줄 추가")'
    ];
    
    for (const selector of expectedElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        console.log(`✅ ${selector} 표시됨`);
      } else {
        console.log(`❌ ${selector} 표시되지 않음`);
      }
    }
    
    console.log('🎉 로그인 완료 후 상태 확인 테스트 완료');
  });
});
