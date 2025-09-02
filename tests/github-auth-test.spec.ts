import { test, expect } from '@playwright/test';

test.describe('GitHub 인증을 통한 MASLABS 앱 테스트', () => {
  test('GitHub 인증 후 Vercel 프로젝트 접근', async ({ page }) => {
    console.log('🚀 GitHub 인증 후 Vercel 프로젝트 접근 테스트 시작');
    
    // Vercel 대시보드로 직접 접근
    await page.goto('https://vercel.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Vercel 대시보드 접속 완료');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/vercel-dashboard.png' });
    console.log('📸 Vercel 대시보드 스크린샷 저장 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('🔗 현재 URL:', currentUrl);
    
    // GitHub 인증 상태 확인
    const githubAuth = page.locator('text=GitHub, text=github, [data-provider="github"]');
    if (await githubAuth.isVisible()) {
      console.log('✅ GitHub 인증 옵션 발견');
    } else {
      console.log('ℹ️ GitHub 인증 옵션이 보이지 않음 (이미 인증됨일 수 있음)');
    }
    
    // 프로젝트 목록 확인
    const projects = page.locator('text=mas-hq, text=MASLABS, text=whalechillz-maslabs');
    if (await projects.isVisible()) {
      console.log('✅ MASLABS 프로젝트 발견');
    } else {
      console.log('ℹ️ MASLABS 프로젝트가 보이지 않음');
    }
    
    console.log('🎉 Vercel 프로젝트 접근 테스트 완료');
  });

  test('GitHub 인증 후 MASLABS 앱 직접 접근', async ({ page }) => {
    console.log('🚀 GitHub 인증 후 MASLABS 앱 직접 접근 테스트 시작');
    
    // GitHub 인증이 완료된 상태에서 MASLABS 앱으로 직접 접근
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ MASLABS 앱 접속 완료');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/maslabs-app-direct.png' });
    console.log('📸 MASLABS 앱 직접 접근 스크린샷 저장 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('🔗 현재 URL:', currentUrl);
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    console.log('📝 페이지 내용 (처음 500자):', pageContent?.substring(0, 500));
    
    // GitHub 인증 후 상태 확인
    if (currentUrl.includes('/login')) {
      console.log('ℹ️ 여전히 로그인 페이지에 있음 (GitHub 인증 필요)');
    } else {
      console.log('✅ 로그인 페이지를 벗어남 (GitHub 인증 완료)');
    }
    
    console.log('🎉 MASLABS 앱 직접 접근 테스트 완료');
  });

  test('GitHub 인증 후 스케줄 추가 페이지 접근', async ({ page }) => {
    console.log('🚀 GitHub 인증 후 스케줄 추가 페이지 접근 테스트 시작');
    
    // GitHub 인증이 완료된 상태에서 스케줄 추가 페이지로 직접 접근
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 스케줄 추가 페이지 접속 시도 완료');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/schedule-add-github-auth.png' });
    console.log('📸 스케줄 추가 페이지 접근 스크린샷 저장 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('🔗 현재 URL:', currentUrl);
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    console.log('📝 페이지 내용 (처음 500자):', pageContent?.substring(0, 500));
    
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
    
    // 날짜 입력 필드 값 확인 (핵심 테스트)
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible()) {
      const dateValue = await dateInput.inputValue();
      console.log('📅 날짜 입력 필드 값:', dateValue);
      
      // 현재 날짜와 비교
      const currentDate = new Date();
      const expectedDate = currentDate.toISOString().split('T')[0];
      console.log('📅 예상 날짜 (현재 날짜):', expectedDate);
      
      if (dateValue === expectedDate) {
        console.log('✅ 날짜가 현재 날짜로 올바르게 설정됨!');
      } else {
        console.log('❌ 날짜가 예상과 다름 (하드코딩된 날짜 문제)');
      }
    } else {
      console.log('❌ 날짜 입력 필드를 찾을 수 없음');
    }
    
    console.log('🎉 스케줄 추가 페이지 접근 테스트 완료');
  });

  test('GitHub 인증 후 전체 플로우 테스트', async ({ page }) => {
    console.log('🚀 GitHub 인증 후 전체 플로우 테스트 시작');
    
    // 1. Vercel 대시보드 접근
    await page.goto('https://vercel.com/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ 1단계: Vercel 대시보드 접근 완료');
    
    // 2. MASLABS 프로젝트로 이동
    await page.goto('https://vercel.com/whalechillz-maslabs-projects/mas-hq');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ 2단계: MASLABS 프로젝트 접근 완료');
    
    // 3. 실제 배포된 앱으로 이동
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 3단계: 실제 배포된 앱 접근 완료');
    
    // 4. 스케줄 추가 페이지로 이동
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 4단계: 스케줄 추가 페이지 접근 완료');
    
    // 최종 스크린샷
    await page.screenshot({ path: 'test-results/full-flow-github-auth.png' });
    console.log('📸 전체 플로우 테스트 스크린샷 저장 완료');
    
    // 최종 상태 확인
    const currentUrl = page.url();
    const title = await page.title();
    console.log('🔗 최종 URL:', currentUrl);
    console.log('📄 최종 페이지 제목:', title);
    
    console.log('🎉 전체 플로우 테스트 완료');
  });
});
