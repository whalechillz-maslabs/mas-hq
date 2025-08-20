import { test, expect } from '@playwright/test';

test('대시보드 버튼 확인 테스트', async ({ page }) => {
  console.log('🔍 대시보드 버튼 확인 테스트 시작');
  
  // 관리자 계정으로 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', '66699000');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log('✅ 로그인 완료');
  
  // 대시보드의 모든 버튼 텍스트 확인
  const buttons = await page.locator('button').all();
  console.log(`총 버튼 개수: ${buttons.length}`);
  
  for (let i = 0; i < buttons.length; i++) {
    const buttonText = await buttons[i].textContent();
    console.log(`버튼 ${i + 1}: "${buttonText}"`);
  }
  
  // 빠른 메뉴 섹션의 버튼들 확인
  const quickMenuButtons = await page.locator('.grid button, .quick-menu button').all();
  console.log(`빠른 메뉴 버튼 개수: ${quickMenuButtons.length}`);
  
  for (let i = 0; i < quickMenuButtons.length; i++) {
    const buttonText = await quickMenuButtons[i].textContent();
    console.log(`빠른 메뉴 버튼 ${i + 1}: "${buttonText}"`);
  }
  
  // 스크린샷 캡처
  await page.screenshot({ 
    path: 'dashboard-buttons-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 대시보드 버튼 확인 테스트 완료!');
});
