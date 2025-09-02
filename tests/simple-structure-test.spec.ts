import { test, expect } from '@playwright/test';

test.describe('Vercel 인증 시스템 구조 확인 테스트', () => {
  test('로그인 페이지 구조 파악', async ({ page }) => {
    console.log('🚀 로그인 페이지 구조 파악 시작');
    
    // 로그인 페이지로 직접 접속
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/login-structure.png' });
    console.log('📸 로그인 페이지 스크린샷 저장 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('🔗 현재 URL:', currentUrl);
    
    // 페이지 내용 전체 확인
    const pageContent = await page.textContent('body');
    console.log('📝 페이지 내용 (처음 1000자):', pageContent?.substring(0, 1000));
    
    // 모든 input 요소 찾기
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log(`🔍 발견된 input 요소 수: ${inputCount}`);
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      
      console.log(`📝 Input ${i + 1}:`, { type, placeholder, id, name });
    }
    
    // 모든 button 요소 찾기
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`🔘 발견된 button 요소 수: ${buttonCount}`);
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      
      console.log(`🔘 Button ${i + 1}:`, { text: text?.trim(), type });
    }
    
    console.log('🎉 로그인 페이지 구조 파악 완료');
  });

  test('로그인 후 페이지 이동 테스트', async ({ page }) => {
    console.log('🚀 로그인 후 페이지 이동 테스트 시작');
    
    // 로그인 페이지로 접속
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/login');
    await page.waitForLoadState('networkidle');
    
    console.log('⏳ 사용자가 로그인을 완료할 때까지 대기 중... (90초)');
    console.log('💡 로그인 후 대시보드나 메인 페이지로 이동해주세요');
    await page.waitForTimeout(90000);
    
    // 로그인 후 상태 확인
    const currentUrl = page.url();
    console.log('🔗 로그인 후 현재 URL:', currentUrl);
    
    const title = await page.title();
    console.log('📄 로그인 후 페이지 제목:', title);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/after-login-structure.png' });
    console.log('📸 로그인 후 상태 스크린샷 저장 완료');
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    console.log('📝 로그인 후 페이지 내용 (처음 500자):', pageContent?.substring(0, 500));
    
    console.log('🎉 로그인 후 페이지 이동 테스트 완료');
  });

  test('스케줄 추가 페이지 접근 테스트', async ({ page }) => {
    console.log('🚀 스케줄 추가 페이지 접근 테스트 시작');
    
    // 로그인 페이지에서 시작
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/login');
    await page.waitForLoadState('networkidle');
    
    console.log('⏳ 사용자가 로그인을 완료할 때까지 대기 중... (90초)');
    console.log('💡 로그인 후 스케줄 추가 페이지로 이동해주세요');
    await page.waitForTimeout(90000);
    
    // 스케줄 추가 페이지로 이동 시도
    console.log('🔗 스케줄 추가 페이지로 이동 시도...');
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 페이지 상태 확인
    const currentUrl = page.url();
    console.log('🔗 스케줄 추가 페이지 URL:', currentUrl);
    
    const title = await page.title();
    console.log('📄 스케줄 추가 페이지 제목:', title);
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/schedule-add-access.png' });
    console.log('📸 스케줄 추가 페이지 접근 스크린샷 저장 완료');
    
    // 페이지 내용 확인
    const pageContent = await page.textContent('body');
    console.log('📝 스케줄 추가 페이지 내용 (처음 500자):', pageContent?.substring(0, 500));
    
    console.log('🎉 스케줄 추가 페이지 접근 테스트 완료');
  });
});
