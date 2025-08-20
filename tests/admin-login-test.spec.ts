import { test, expect } from '@playwright/test';

test.describe('관리자 계정 로그인 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
  });

  test('관리자 계정 로그인 테스트 (전화번호)', async ({ page }) => {
    console.log('🔍 관리자 계정 로그인 테스트 시작 (전화번호)');
    
    // 관리자 계정으로 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 관리자 계정 로그인 성공 (전화번호)');
    
    // 대시보드에서 관리자 정보 확인
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    
    console.log('✅ 관리자 정보 확인 완료');
    
    // 빠른 메뉴 확인
    await expect(page.locator('text=근무 스케줄')).toBeVisible();
    await expect(page.locator('text=급여 조회')).toBeVisible();
    await expect(page.locator('text=업무 기록')).toBeVisible();
    await expect(page.locator('text=조직도')).toBeVisible();
    
    console.log('✅ 빠른 메뉴 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'admin-login-phone-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 관리자 계정 로그인 테스트 완료! (전화번호)');
  });

  test('관리자 계정 로그인 테스트 (핀번호)', async ({ page }) => {
    console.log('🔍 관리자 계정 로그인 테스트 시작 (핀번호)');
    
    // 핀번호 로그인 탭 선택
    await page.click('text=핀번호');
    
    // 기본 핀번호 입력
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 관리자 계정 로그인 성공 (핀번호)');
    
    // 대시보드에서 관리자 정보 확인
    await expect(page.locator('text=시스템 관리자')).toBeVisible();
    
    console.log('✅ 관리자 정보 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'admin-login-pin-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 관리자 계정 로그인 테스트 완료! (핀번호)');
  });

  test('관리자 업무 기록 페이지 테스트', async ({ page }) => {
    console.log('🔍 관리자 업무 기록 페이지 테스트 시작');
    
    // 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 업무 기록 페이지로 이동
    await page.click('text=업무 기록');
    await page.waitForURL('**/tasks');
    
    // 페이지 제목 확인
    await expect(page.locator('text=업무 기록')).toBeVisible();
    
    // 업무 추가 버튼 확인
    await expect(page.locator('text=업무 추가')).toBeVisible();
    
    console.log('✅ 업무 기록 페이지 확인 완료');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'admin-tasks-page-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 관리자 업무 기록 페이지 테스트 완료!');
  });
});
