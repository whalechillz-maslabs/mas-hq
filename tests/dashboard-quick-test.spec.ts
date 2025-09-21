import { test, expect } from '@playwright/test';

test('대시보드 페이지 접근 테스트', async ({ page }) => {
  console.log('🔍 대시보드 페이지 접근 테스트 시작');
  
  // 로그인 페이지로 이동
  await page.goto('https://maslabs.kr/login');
  await page.waitForLoadState('networkidle');
  
  // 나수진으로 로그인
  await page.fill('input[placeholder*="전화번호"], input[name*="phone"], input[type="tel"]', '010-2391-4431');
  await page.fill('input[type="password"], input[placeholder*="비밀번호"]', '23914431');
  await page.click('button[type="submit"], button:has-text("로그인")');
  
  // 로그인 성공 확인
  await expect(page).toHaveURL(/.*tasks/);
  
  // 대시보드로 이동
  await page.goto('https://maslabs.kr/dashboard');
  await page.waitForLoadState('networkidle');
  
  // 페이지가 정상적으로 로딩되는지 확인
  await expect(page.locator('body')).not.toContainText('Application error');
  
  // 대시보드 요소들이 보이는지 확인
  await expect(page.locator('text=빠른 메뉴')).toBeVisible();
  
  console.log('✅ 대시보드 페이지 접근 테스트 완료');
});
