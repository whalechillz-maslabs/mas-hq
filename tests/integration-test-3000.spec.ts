import { test, expect } from '@playwright/test';

test.describe('포트 3002 통합 테스트', () => {
  test('메인 페이지 접근 테스트', async ({ page }) => {
    console.log('🔍 메인 페이지 접근 테스트 시작');
    
    // 메인 페이지로 이동 (포트 3002)
    await page.goto('http://localhost:3000');
    
    console.log('✅ 메인 페이지 접근 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('페이지 제목:', title);
    expect(title).toContain('MASLABS');
    
    console.log('🎉 메인 페이지 접근 테스트 완료!');
  });

  test('로그인 페이지 접근 테스트', async ({ page }) => {
    console.log('🔍 로그인 페이지 접근 테스트 시작');
    
    // 로그인 페이지로 이동 (포트 3002)
    await page.goto('http://localhost:3000/login');
    
    console.log('✅ 로그인 페이지 접근 완료');
    
    // 로그인 폼 요소 확인
    const phoneInput = await page.locator('input[name="phone"], input[type="tel"]').count();
    const passwordInput = await page.locator('input[name="password"], input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log('로그인 폼 요소 확인:');
    console.log(`전화번호 입력: ${phoneInput > 0 ? '✅' : '❌'}`);
    console.log(`비밀번호 입력: ${passwordInput > 0 ? '✅' : '❌'}`);
    console.log(`제출 버튼: ${submitButton > 0 ? '✅' : '❌'}`);
    
    expect(phoneInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
    expect(submitButton).toBeGreaterThan(0);
    
    console.log('🎉 로그인 페이지 접근 테스트 완료!');
  });

  test('관리자 로그인 및 대시보드 테스트', async ({ page }) => {
    console.log('🔍 관리자 로그인 및 대시보드 테스트 시작');
    
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    
    // 로그인 방법 선택 (전화번호)
    await page.click('text=전화번호');
    console.log('✅ 전화번호 로그인 방법 선택');
    
    // 전화번호 입력 (관리자 계정)
    await page.fill('input[type="tel"]', '010-6669-9000');
    console.log('✅ 관리자 전화번호 입력: 010-6669-9000');
    
    // 비밀번호 입력
    await page.fill('input[type="password"]', '66699000');
    console.log('✅ 관리자 비밀번호 입력: 66699000');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard');
    console.log('✅ 대시보드 페이지 로딩 완료');
    
    // 관리자 계정 확인
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    console.log('✅ 관리자 계정 로그인 확인');
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'admin-dashboard-3002.png', fullPage: true });
    console.log('✅ 대시보드 스크린샷 캡처 완료');
    
    console.log('🎉 관리자 로그인 및 대시보드 테스트 완료!');
  });

  test('업무 기록 페이지 테스트', async ({ page }) => {
    console.log('🔍 업무 기록 페이지 테스트 시작');
    
    // 먼저 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 업무 기록 페이지로 이동
    await page.goto('http://localhost:3000/tasks');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 페이지 제목 확인
    await expect(page.locator('text=업무 기록')).toBeVisible();
    console.log('✅ 업무 기록 페이지 제목 확인');
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'tasks-page-3002.png', fullPage: true });
    console.log('✅ 업무 기록 페이지 스크린샷 캡처 완료');
    
    console.log('🎉 업무 기록 페이지 테스트 완료!');
  });

  test('스케줄 페이지 테스트', async ({ page }) => {
    console.log('🔍 스케줄 페이지 테스트 시작');
    
    // 먼저 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 스케줄 페이지로 이동
    await page.goto('http://localhost:3000/schedules');
    
    console.log('✅ 스케줄 페이지 접근 완료');
    
    // 페이지 제목 확인
    await expect(page.locator('text=스케줄')).toBeVisible();
    console.log('✅ 스케줄 페이지 제목 확인');
    
    // 스크린샷 캡처
    await page.screenshot({ path: 'schedules-page-3002.png', fullPage: true });
    console.log('✅ 스케줄 페이지 스크린샷 캡처 완료');
    
    console.log('🎉 스케줄 페이지 테스트 완료!');
  });
});
