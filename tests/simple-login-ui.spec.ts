import { test, expect } from '@playwright/test';

test('간단한 로그인 UI 테스트', async ({ page }) => {
  // 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  
  // 페이지 로드 확인
  await expect(page.locator('h2:has-text("직원 로그인")')).toBeVisible();
  
  // 전화번호 입력
  await page.fill('input[type="tel"]', '010-6669-9000');
  
  // 비밀번호 입력
  await page.fill('input[type="password"]', '66699000');
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  
  // 5초 대기 (로그인 처리 시간)
  await page.waitForTimeout(5000);
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log('현재 URL:', currentUrl);
  
  // 에러 메시지 확인
  const errorText = await page.locator('text=전화번호를 찾을 수 없습니다').count();
  console.log('에러 메시지 개수:', errorText);
  
  if (errorText > 0) {
    console.log('❌ 로그인 실패: 전화번호를 찾을 수 없습니다');
  } else if (currentUrl.includes('/dashboard')) {
    console.log('✅ 로그인 성공!');
  } else {
    console.log('❓ 로그인 상태 불명확');
  }
  
  // 스크린샷 캡처
  await page.screenshot({ 
    path: 'simple-login-ui-test.png', 
    fullPage: true 
  });
});
