import { test, expect } from '@playwright/test';

test('기본 로그인 및 페이지 접근 테스트', async ({ page }) => {
  // 1. 로그인
  console.log('🔍 로그인 테스트 시작');
  await page.goto('http://localhost:3000/login');
  
  // 전화번호로 로그인
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 로그인 성공');
  
  // 2. 대시보드 확인
  console.log('🔍 대시보드 확인');
  await page.waitForLoadState('networkidle');
  
  // 기본 요소들 확인
  await expect(page.locator('text=오늘의 미션')).toBeVisible();
  await expect(page.locator('text=근무 상태')).toBeVisible();
  
  console.log('✅ 대시보드 로딩 성공');
  
  // 3. 스크린샷 캡처
  await page.screenshot({ 
    path: 'dashboard-simple-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 기본 테스트 완료!');
});

test('핀번호 로그인 테스트', async ({ page }) => {
  console.log('🔍 핀번호 로그인 테스트 시작');
  await page.goto('http://localhost:3000/login');
  
  // 핀번호 로그인 탭 선택
  await page.click('text=핀번호');
  
  // 핀번호 입력 (1234)
  await page.fill('input[placeholder="0000"]', '1234');
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 핀번호 로그인 성공');
  
  // 스크린샷 캡처
  await page.screenshot({ 
    path: 'pin-login-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 핀번호 로그인 테스트 완료!');
});
