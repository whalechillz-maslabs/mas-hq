import { test, expect } from '@playwright/test';

test.describe('비밀번호 보안 테스트', () => {
  test('올바른 비밀번호로 로그인', async ({ page }) => {
    await page.goto('/login');
    
    // 올바른 비밀번호로 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('올바른 비밀번호 로그인 후 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 올바른 비밀번호로 로그인 성공');
    } else {
      console.log('❌ 올바른 비밀번호로 로그인 실패');
    }
  });

  test('잘못된 비밀번호로 로그인 시도', async ({ page }) => {
    await page.goto('/login');
    
    // 잘못된 비밀번호로 로그인 시도
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('잘못된 비밀번호 로그인 후 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('❌ 잘못된 비밀번호로도 로그인 성공 (보안 문제)');
    } else {
      console.log('✅ 잘못된 비밀번호로 로그인 차단됨 (보안 정상)');
      
      // 에러 메시지 확인
      const errorText = await page.locator('text=비밀번호가 올바르지 않습니다').count();
      if (errorText > 0) {
        console.log('✅ 적절한 에러 메시지 표시됨');
      } else {
        console.log('❌ 에러 메시지가 표시되지 않음');
      }
    }
  });

  test('빈 비밀번호로 로그인 시도', async ({ page }) => {
    await page.goto('/login');
    
    // 빈 비밀번호로 로그인 시도
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('빈 비밀번호 로그인 후 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('❌ 빈 비밀번호로도 로그인 성공 (보안 문제)');
    } else {
      console.log('✅ 빈 비밀번호로 로그인 차단됨 (보안 정상)');
    }
  });
});
