import { test, expect } from '@playwright/test';

test('간단한 로그인 테스트', async ({ page }) => {
  console.log('🔍 간단한 로그인 테스트 시작');
  
  // 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  
  // 페이지 로드 확인
  await expect(page.locator('text=로그인')).toBeVisible();
  
  console.log('✅ 로그인 페이지 로드 완료');
  
  // 전화번호 입력
  await page.fill('input[type="tel"]', '010-6669-9000');
  
  // 비밀번호 입력
  await page.fill('input[type="password"]', 'admin123');
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  
  console.log('✅ 로그인 버튼 클릭 완료');
  
  // 잠시 대기
  await page.waitForTimeout(3000);
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log('현재 URL:', currentUrl);
  
  // 스크린샷 캡처
  await page.screenshot({ 
    path: 'simple-login-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 간단한 로그인 테스트 완료!');
});
