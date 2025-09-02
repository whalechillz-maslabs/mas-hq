import { test, expect } from '@playwright/test';

test.describe('단계별 스케줄 추가 페이지 테스트', () => {
  test('1단계: 홈페이지 접속 및 기본 구조 확인', async ({ page }) => {
    console.log('🚀 1단계 시작: 홈페이지 접속');
    
    // 새로운 배포된 사이트 접속
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 홈페이지 접속 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/1-homepage.png' });
    console.log('📸 홈페이지 스크린샷 저장 완료');
    
    // 기본 요소들 확인
    const elements = [
      'text=MASLABS',
      'text=로그인',
      'text=대시보드'
    ];
    
    for (const selector of elements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        console.log(`✅ ${selector} 표시됨`);
      } else {
        console.log(`❌ ${selector} 표시되지 않음`);
      }
    }
    
    console.log('🎉 1단계 완료: 홈페이지 기본 구조 확인');
  });

  test('2단계: 로그인 페이지 접속 및 구조 확인', async ({ page }) => {
    console.log('🚀 2단계 시작: 로그인 페이지 접속');
    
    // 로그인 페이지로 이동
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/2-login-page.png' });
    console.log('📸 로그인 페이지 스크린샷 저장 완료');
    
    // 로그인 폼 요소 확인
    const formElements = [
      'input[id="phone"]',
      'input[id="password"]',
      'button[type="submit"]',
      'text=전화번호',
      'text=비밀번호'
    ];
    
    for (const selector of formElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        console.log(`✅ ${selector} 표시됨`);
      } else {
        console.log(`❌ ${selector} 표시되지 않음`);
      }
    }
    
    console.log('🎉 2단계 완료: 로그인 페이지 구조 확인');
    console.log('⏳ 사용자가 로그인을 완료할 때까지 대기 중...');
    
    // 사용자가 로그인할 때까지 대기 (30초)
    await page.waitForTimeout(30000);
    
    console.log('✅ 로그인 대기 완료');
  });

  test('3단계: 로그인 후 대시보드 확인', async ({ page }) => {
    console.log('🚀 3단계 시작: 로그인 후 상태 확인');
    
    // 로그인 페이지에서 시작
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/login');
    await page.waitForLoadState('networkidle');
    
    console.log('⏳ 사용자가 로그인을 완료할 때까지 대기 중... (60초)');
    await page.waitForTimeout(60000);
    
    // 로그인 후 페이지 스크린샷
    await page.screenshot({ path: 'test-results/3-after-login.png' });
    console.log('📸 로그인 후 상태 스크린샷 저장 완료');
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('🔗 현재 URL:', currentUrl);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    console.log('🎉 3단계 완료: 로그인 후 상태 확인');
  });

  test('4단계: 스케줄 추가 페이지 접속 시도', async ({ page }) => {
    console.log('🚀 4단계 시작: 스케줄 추가 페이지 접속');
    
    // 로그인 페이지에서 시작
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/login');
    await page.waitForLoadState('networkidle');
    
    console.log('⏳ 사용자가 로그인을 완료할 때까지 대기 중... (60초)');
    await page.waitForTimeout(60000);
    
    // 스케줄 추가 페이지로 이동 시도
    console.log('🔗 스케줄 추가 페이지로 이동 시도...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/4-schedule-add-page.png' });
    console.log('📸 스케줄 추가 페이지 스크린샷 저장 완료');
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('🔗 현재 URL:', currentUrl);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    console.log('📝 페이지 내용 (처음 500자):', pageContent?.substring(0, 500));
    
    console.log('🎉 4단계 완료: 스케줄 추가 페이지 접속 시도');
  });

  test('5단계: 스케줄 추가 페이지 요소 확인', async ({ page }) => {
    console.log('🚀 5단계 시작: 스케줄 추가 페이지 요소 확인');
    
    // 로그인 페이지에서 시작
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/login');
    await page.waitForLoadState('networkidle');
    
    console.log('⏳ 사용자가 로그인을 완료할 때까지 대기 중... (60초)');
    await page.waitForTimeout(60000);
    
    // 스케줄 추가 페이지로 이동
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 주요 요소들 확인
    const expectedElements = [
      'text=새 스케줄 추가',
      'input[type="date"]',
      'input[type="time"]',
      'textarea',
      'button:has-text("취소")',
      'button:has-text("스케줄 추가")',
      'text=기존 스케줄',
      'text=시간대별 근무자 현황'
    ];
    
    console.log('🔍 주요 요소 확인 중...');
    for (const selector of expectedElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        console.log(`✅ ${selector} 표시됨`);
      } else {
        console.log(`❌ ${selector} 표시되지 않음`);
      }
    }
    
    // 날짜 입력 필드 값 확인
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      const dateValue = await dateInput.inputValue();
      console.log('📅 날짜 입력 필드 값:', dateValue);
      
      // 현재 날짜와 비교
      const currentDate = new Date();
      const expectedDate = currentDate.toISOString().split('T')[0];
      console.log('📅 예상 날짜:', expectedDate);
      
      if (dateValue === expectedDate) {
        console.log('✅ 날짜가 현재 날짜로 올바르게 설정됨');
      } else {
        console.log('❌ 날짜가 예상과 다름');
      }
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/5-elements-check.png' });
    console.log('📸 요소 확인 완료 스크린샷 저장');
    
    console.log('🎉 5단계 완료: 스케줄 추가 페이지 요소 확인');
  });
});
